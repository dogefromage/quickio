import { compressNumber, createCounter } from "../utils";
import { ECS } from "./ecs";
import { ClientDataPacket, EntityUpdate, EntityUpdateTypes, ServerDataPacket } from "./ecsTypes";

export class ServerECS extends ECS
{
    public dataIndexCounter = createCounter();
    
    update()
    {
        super.update(true, true, false);
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
                    entityStatePairs = [ id, EntityUpdateTypes.Basic, [] ];
                    entitiesStates.set(id, entityStatePairs);
                }

                let compState = component.getState();
                entityStatePairs[2]!.push([ i, compState ]);
            }
        }

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

    setClientData(clientDataJson: string)
    {
        const clientData = JSON.parse(clientDataJson) as ClientDataPacket;

        // IMPLEMENT
    }
}

