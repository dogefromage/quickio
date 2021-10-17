import { compressNumber } from "../utils";
import { ECS } from "./ecs";
import { ClientDataPacket, ComponentArrayItem, LocalArgs, ServerDataPacket } from "./ecsTypes";

export class ClientECS extends ECS
{
    private clientInputChannel;

    constructor(
        componentList: ComponentArrayItem[],
        localArgs: LocalArgs,
        public clientId: string
    )
    {
        super(componentList, localArgs);

        this.clientInputChannel = this.createInputChannel(clientId);

        document.addEventListener('keydown', (e: KeyboardEvent) =>
        {
            this.clientInputChannel.setKeyDown(e.keyCode);
        });
        document.addEventListener('keyup', (e: KeyboardEvent) =>
        {
            this.clientInputChannel.setKeyUp(e.keyCode);
        });
    }

    update()
    {
        super.update(true, false, true);
    }

    /**
     * @internal
     */
    processServerData(serverData: ServerDataPacket)
    {
        const serverEntities = serverData.en;

        if (serverEntities == null) return;

        for (const [ id, updateType, componentList ] of serverEntities)
        {
            let entity = this.entities.get(id);
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

                comp.setState(componentState);
            }
        }
    }

    /**
     * @internal
     */
    collectClientData()
    {
        const clientData = {} as ClientDataPacket;
        
        const input = this.clientInputChannel.getDataAndClear();
        if (input != null)
        {
            clientData.in = input;
        }

        if (Object.entries(clientData).length > 0)
        {
            return clientData;
        }
    }

    exchangeData(serverDataString: string)
    {
        const serverData = JSON.parse(serverDataString) as ServerDataPacket;

        this.processServerData(serverData);

        let clientData = this.collectClientData();
        if (clientData != null)
        {
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
