import { ActiveComponent, Component, ComponentMethodParams, Entity } from "..";
import { InputChannel, InputData } from "../inputChannel";
import { compressNumber, createCounter, quickWarn } from "../utils";
import { ECS } from "./ecs";
import { ClientDataPacket, EntityUpdate, EntityUpdateTypes, ServerDataPacket } from "./ecsTypes";

export class ServerECS extends ECS
{
    /** @internal */
    dataIndexCounter = createCounter();
    
    /** @internal */
    destroyedEntities = new Set<string>();

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

    getData()
    {
        const data = 
        {
            ix: this.dataIndexCounter.next().value,
        } as ServerDataPacket;

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

        const dataJson = JSON.stringify(data, (key, value) =>
        {
            if (typeof(value) === 'number')
            {
                return compressNumber(value);
            }

            return value;
        });

        return dataJson;
    }

    setClientInput(clientId: string, input: InputData)
    {
        let channel = this.getInputChannel(clientId) as InputChannel;
        if (channel == null) return quickWarn(`Server received input data from socket ${clientId}, but the corresponding input channel does not exist. Data was ignored.`);

        channel.setDataAndUpdate(input);
    }

    onClientData(clientId: string, clientDataJson: string)
    {
        const clientData = JSON.parse(clientDataJson) as ClientDataPacket;

        if (clientData.in)
        {
            this.setClientInput(clientId, clientData.in);
        }
    }
}
