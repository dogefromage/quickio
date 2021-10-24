import { ActiveComponent } from "..";
import { InputChannel } from "../inputChannel";
import { Time } from "../time";
import { compressNumber, Counter } from "../utils";
import { BrowserECS } from "./browserEcs";
import { ClientDataPacket, ComponentArrayItem, EntityUpdateTypes, LocalArgs, ServerDataPacket } from "./ecsTypes";

export class ClientECS extends BrowserECS
{
    /** @internal */
    serverTime = new Time();

    /** @internal */
    dataIndexCounter = new Counter();

    /** @internal */
    private secondaryInputChannel = new InputChannel('__secondary__');

    constructor(
        componentList: ComponentArrayItem[],
        localArgs: LocalArgs,
        public clientId: string
    )
    {
        // will listen to input channel with same ID as socket client
        super(componentList, localArgs, clientId); 
    }

    update()
    {
        this._time.update();

        const methodParams = this.getComponentMethodParams();

        // UPDATE INTERPOLATE
        for (const componentRow of this.components)
        {
            for (let component of componentRow.instances)
            {
                component.interpolateState(methodParams);
                
                if (component instanceof ActiveComponent)
                {
                    component.activeUpdate(methodParams);
                }
            }
        }

        // RENDER
        for (const componentRow of this.components)
        {
            for (let component of componentRow.instances)
            {
                component.render(methodParams);
            }
        }
    }

    onServerData(serverDataString: string)
    {
        this.serverTime.update();

        const serverData = JSON.parse(serverDataString) as ServerDataPacket;

        /**
         * Process all entity data sent by the server
         */
        for (const [ id, updateType, componentList ] of serverData.en || [])
        {
            let entity = this.entities.get(id);

            if (updateType === EntityUpdateTypes.Update)
            {
                if (!entity)
                {
                    entity = this.createEntity(id);
                }
    
                if (!componentList) continue;
    
                for (const [ componentIndex, componentState ] of componentList)
                {
                    const row = this.components[componentIndex];
                    
                    let comp = entity.getComponent(row.componentClass);
                    if (!comp) comp = entity.addComponent(row.componentClass);
    
                    comp.onServerState(componentState, serverData.ix, this.serverTime);
                }
            }
            else if (updateType === EntityUpdateTypes.Destroyed)
            {
                if (entity)
                {
                    this.destroy(entity);
                }
            }
        }

        /**
         * collect client data
         */
        const clientData = {} as ClientDataPacket;
        
        // get input data
        const input = this.mainInputChannel.getDataAndUpdate();
        if (input != null) clientData.in = input;

        // only send data if there's something to send
        if (Object.entries(clientData).length > 0)
        {
            clientData.ix = this.dataIndexCounter.next();

            return JSON.stringify(clientData, (key, value) =>
            {
                if (typeof(value) === 'number')
                {
                    return compressNumber(value);
                }
                return value;
            });
        }
    }
}
