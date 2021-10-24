import { ActiveComponent, Component, ComponentMethodParams, Entity, quickError } from "..";
import { InputChannel, InputData } from "../inputChannel";
import { compressNumber, createCounter, quickWarn } from "../utils";
import { ECS } from "./ecs";
import { ClientDataPacket, EntityUpdate, EntityUpdateTypes, ServerDataPacket } from "./ecsTypes";

export interface Client
{
    id: string,
    lastDataIndex: number;
}

export class ServerECS extends ECS
{
    /** @internal */
    destroyedEntities = new Set<string>();

    private clients = new Map<string, Client>();

    createClient(clientId: string, dontCreateInputChannel = false)
    {
        let client: Client = 
        {
            id: clientId,
            lastDataIndex: -1,
        };

        this.clients.set(clientId, client);
        if (!dontCreateInputChannel) this.createInputChannel(clientId);
    }

    removeClient(clientId: string, keepInputChannel = false)
    {
        let client = this.clients.get(clientId);

        if (!client) return quickWarn(`Client with id=${clientId} was not found.`);

        this.clients.delete(client.id);
        if (!keepInputChannel) this.removeInputChannel(client.id);
    }

    destroy(obj: Component): void;
    destroy(obj: Entity): void;
    destroy(obj: any)
    {
        super.destroy(obj);

        if (obj instanceof Entity)
        {
            this.destroyedEntities.add(obj.id);
        }
    }
    
    update()
    {
        this._time.update();

        const methodParams = this.getComponentMethodParams();

        // START
        for (const componentRow of this.components)
        {
            for (let component of componentRow.instances)
            {
                if (!component.hasRunStart)
                {
                    component.start(methodParams);
                    component.hasRunStart = true;
                }
            }
        }

        for (const componentRow of this.components)
        {
            for (let component of componentRow.instances)
            {
                if (component instanceof ActiveComponent)
                {
                    component.activeUpdate(methodParams);
                }

                component.update(methodParams);
            }
        }
    }

    collectData(clientIdList: string[], callback: (clientId: string, data: string) => void)
    {
        const data: ServerDataPacket = 
        {
            ix: -1,
        };

        let entitiesStates = new Map<string, EntityUpdate>();

        for (let i = 0; i < this.components.length; i++)
        {
            for (const component of this.components[i].instances)
            {
                const id = component.entity.id;

                let entityStatePairs = entitiesStates.get(id);

                if (!entityStatePairs)
                {
                    entityStatePairs = [ id, EntityUpdateTypes.Update, [] ];
                    entitiesStates.set(id, entityStatePairs);
                }

                let compState = component.getState();
                entityStatePairs[2]!.push([ i, compState ]);
            }
        }

        for (const id of this.destroyedEntities)
        {
            entitiesStates.set(id, [ id, EntityUpdateTypes.Destroyed ]);
        }
        this.destroyedEntities.clear();

        data.en = [ ...entitiesStates.values() ];


        for (const clientId of clientIdList)
        {
            let client = this.clients.get(clientId);
            
            if (client && client.lastDataIndex > 0)
            {
                data.ix = client.lastDataIndex;
            }

            const dataJson = JSON.stringify(data, (key, value) =>
            {
                if (typeof(value) === 'number')
                {
                    return compressNumber(value);
                }
    
                return value;
            });

            callback(clientId, dataJson);
        }
    }

    onClientData(clientId: string, clientDataJson: string)
    {
        const clientData = JSON.parse(clientDataJson) as ClientDataPacket;

        const client = this.clients.get(clientId);
        if (!client) return quickError(`Client data was attempted to be set for client which did not exist (clientId=${clientId}).`);

        client.lastDataIndex = clientData.ix;

        if (clientData.in != null)
        {
            let channel = this.getInputChannel(clientId) as InputChannel;
            if (channel == null) return quickWarn(`Client input was received for clientId=${clientId}, but the corresponding input channel did not exist. Data was ignored.`);
    
            channel.setDataAndUpdate(clientData.in);
        }
    }
}
