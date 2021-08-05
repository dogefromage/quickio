import * as io from 'socket.io-client';
import { EventHandler } from './eventhandler';
import { ClientData, ClientDataRequest, ClientGameObject, ClientInput, GameObjectState, GameObjectTemplate, ServerGameData } from './types';
import { lerp } from './utils';

class ClientGOPlaceholder implements ClientGameObject
{
    constructor(private state: GameObjectState) {}

    update(dt: number) {}
    
    setState(state: GameObjectState) { this.state = state };

    getState() { return this.state };

    onServerData(serverState: GameObjectState, dataIndex: number)
    {
        this.state = serverState;
    }
}

interface PlayerInputQueueObject
{
    dt: number,
    index: number,
    input: ClientInput,
};

export class ClientGame extends EventHandler
{
    private lastTime = new Date().getTime() / 1000;

    private mainPlayer?: ClientGameObject;

    private gameObjects = new Map<string, ClientGameObject>();

    private dataRequestHistory = new Map<number, ClientDataRequest>();

    private lastServerDataMillis = new Date().getTime();
    private lastInputTimestamp = 0;
    private avgServerDeltaTime = -1;

    private currentDataIndex = 0;

    private playerInputQueue = new Array<PlayerInputQueueObject>();
    
    constructor(
        private gameObjectTemplates: GameObjectTemplate[],
        private inputManager: InputManager,
        private socket: io.Socket,
    )
    {
        super();

        this.socket.on('server-data', (jsonData, requestCallback) => 
                this.onServerData(jsonData, requestCallback) 
            );
    }

    getMainPlayer()
    {
        return this.mainPlayer;
    }

    *gameObjectsOfType(type: number)
    {
        let goType = this.gameObjectTemplates.find((el) => el.type === type);
        if (goType === undefined)
        {
            return;
        }

        for (let [ id, go ] of this.gameObjects)
        {
            if (go instanceof goType.class)
            {
                yield go;
            }
        }
    }

    *gameObjectsOfClass(T: any)
    {
        for (let [ id, go ] of this.gameObjects)
        {
            if (go instanceof T)
            {
                yield go;
            }
        }
    }

    update()
    {
        requestAnimationFrame( () => this.update() );

        //////////// TIME ////////////////
        let currentTime = new Date().getTime() / 1000;
        let dt = currentTime - this.lastTime;
        this.lastTime = currentTime;

        //////////// UPDATE GAMEOBJECTS ////////////////
        for (let [ id, go ] of this.gameObjects)
        {
            go.update(dt);
        }
    }

    onServerData(dataString: string, clientDataCallback: (clientData: ClientData) => void)
    {
        let currentMillis = new Date().getTime();
        let dtServer = 0.001 * (currentMillis - this.lastServerDataMillis);

        if (this.avgServerDeltaTime < 0) // first call
        {
            this.avgServerDeltaTime = dtServer;
        }
        else
        {
            // rolling average
            this.avgServerDeltaTime = lerp(this.avgServerDeltaTime, dtServer, 0.2);
        }

        // safety
        if (this.avgServerDeltaTime === 0) this.avgServerDeltaTime = 0.1;
        
        /**
         * clientdataObject which will be sent back to the server
         */
        this.currentDataIndex++;

        let clientData: ClientData = 
        {
            ix: this.currentDataIndex,
            // in: inputManager.getAxesDelta(this.lastInputBufferIndex)
            in: this.inputManager.getNew(this.lastInputTimestamp),
        };

        if (this.mainPlayer !== undefined)
        {
            // this.mainPlayer.saveState?.(dtServer, clientData.ix, clientData.in);
            let state: PlayerInputQueueObject = 
            {
                dt: dtServer,
                index: clientData.ix,
                input: clientData.in,
            };
            
            this.playerInputQueue.push(state);
        }
        this.lastInputTimestamp = this.inputManager.getCurrentIndex();


        // save all ids for later use
        let allClientIds = new Set<string>();
        for (let [ id, go ] of this.gameObjects)
        {
            allClientIds.add(id);
        }

        let serverData = <ServerGameData>JSON.parse(dataString);

        ////////////// ANSWER REQUEST //////////////
        if (serverData.in !== undefined || serverData.ex !== undefined)
        {
            let dataRequest = this.dataRequestHistory.get(serverData.ix);
            if (dataRequest !== undefined)
            {
                ////////////// INFORMATION FOR CREATING NEW OBJECTS //////////////
                if (serverData.in !== undefined)
                {
                    for (let i = 0; i < serverData.in.length; i++)
                    {
                        let id = dataRequest.in[i];
                        let info = serverData.in[i];

                        let goType = Number(info.shift());
                        let goTemplate = this.gameObjectTemplates.find((el) => el.type === goType);

                        if (goTemplate === undefined) continue;

                        let newGo = new goTemplate.class(...info);

                        if (newGo !== undefined)
                        {
                            // remove old
                            let oldGo = this.gameObjects.get(id);
                            if (oldGo !== undefined)
                            {
                                if (oldGo instanceof ClientGOPlaceholder)
                                {
                                    newGo.setState(oldGo.getState());
                                }
                                oldGo.onDeath?.();
                                oldGo.onUnload?.();
                                this.gameObjects.delete(id);
                            }

                            // add go
                            this.gameObjects.set(id, newGo);

                            if (id === this.socket.id)
                            {
                                this.mainPlayer = newGo;
                            }
                        }
                    }
                }
    
                ////////////// DELETION OF OLD OBJECTS //////////////
                if (serverData.ex !== undefined)
                {
                    for (let i = 0; i < serverData.ex.length; i++)
                    {
                        let id = dataRequest.ex[i];
                        let isStillExisting = serverData.ex[i];
    
                        if (isStillExisting === 0)
                        {
                            // remove gameobject
                            let go = this.gameObjects.get(id);
    
                            if (go !== undefined)
                            {
                                go.onDeath?.();
                                go.onUnload?.();

                                this.gameObjects.delete(id);
                                allClientIds.delete(id);

                                if (id === this.socket.id)
                                {
                                    this.mainPlayer = undefined;
                        
                                    this.dispatchEvent('death', {} );
                                }
                            }
                        }
                    }
                }
    
                this.dataRequestHistory.delete(serverData.ix);
            }
            else
            {
                console.error("QuickIO: No match on client found for servers request answer.");
            }
        }

        let newRequest: ClientDataRequest = 
        {
            in: [],
            ex: [],
        };

        ////////////// GAMEOBJECTS //////////////
        if (serverData.go !== undefined)
        {
            for (let [ id, goState ] of serverData.go)
            {
                let go = this.gameObjects.get(id);

                if (go === undefined)
                {
                    /**
                     * doesn't know obj, ask for information with request
                     * & create dummy obj
                     */
                    newRequest.in.push(id);

                    const dummy = new ClientGOPlaceholder(goState);
                    this.gameObjects.set(id, dummy);
                }
                else
                {
                    go.onServerData(goState, serverData.ix, this.avgServerDeltaTime);
                }

                allClientIds.delete(id);
            }
        }

        /**
         * server hasn't sent any information about these ids,
         * ask if their objects still exist
         */
        for (let id of allClientIds)
        {
            newRequest.ex.push(id);
        }

        if (newRequest.in.length > 0 || newRequest.ex.length > 0)
        {
            // request has data, therefore save and attach to clientData
            this.dataRequestHistory.set(this.currentDataIndex, newRequest);

            clientData.re = newRequest;
        }

        // send back clientData to server
        clientDataCallback(clientData);

        this.lastServerDataMillis = currentMillis;
    }
}
