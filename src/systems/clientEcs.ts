import { Component, ECS } from "..";
import { InputChannel, InputData } from "../inputChannel";
import { InputListener } from "../inputListener";
import { Time } from "../time";
import { compressNumber, Counter } from "../utils";
import { ClientDataPacket, ComponentArrayItem, EntityUpdateTypes, LocalArgs, ServerDataPacket } from "./ecsTypes";

export interface InputQueueItem
{
    time: Time;
    index: number;
    input: InputData;
}

export class ClientECS extends ECS
{
    /** @internal */
    serverTime = new Time();

    /** @internal */
    inputIndexCounter = new Counter();

    private _inputListener = new InputListener();
    /**
     * The {@link InputListener} class can be used to configure the inputs which will be sent to the server every update.
     */
    get inputListener() { return this._inputListener; }

    /** @internal */
    private mainInputChannel;

    /** @internal */
    private localInputChannel;

    /** @internal */
    private inputQueue: InputQueueItem[] = [];
    
    constructor(
        componentList: ComponentArrayItem[],
        localArgs: LocalArgs,
        public clientId: string
    )
    {
        super(componentList, localArgs);

        this.mainInputChannel = this.createInputChannel('__main__');
        this.localInputChannel = this.createInputChannel('__local__');
        
        this.inputListener.addChannel(this.mainInputChannel);
        this.inputListener.addChannel(this.localInputChannel);
    }

    isActiveComponent(component: Component)
    {
        return this.clientId === component.input.id;
    }

    update()
    {
        this._time.update();
        const methodParams = this.getComponentMethodParams();

        let inputData = this.localInputChannel.getDataAndUpdate();
        this.inputQueue.push({
            time: this._time.copy(),
            index: this.inputIndexCounter.current,
            input: inputData || {},
        });

        // UPDATE INTERPOLATE
        for (const componentRow of this.components)
        {
            for (let component of componentRow.instances)
            {
                if (this.isActiveComponent(component))
                {
                    component.animate(methodParams);
                }
                else
                {
                    component.interpolate(methodParams);
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
        
        this.inputIndexCounter.next();
        
        /** 
         * snip off old state from state queue
         */
        while (
            this.inputQueue.length === 0 &&
            serverData.ix < this.inputQueue[0].index
        )
        {
            this.inputQueue.shift();
        }

        let methodParams = this.getComponentMethodParams();

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
    
                    if (this.isActiveComponent(comp))
                    {
                        comp.onServerStateActive(componentState, this.inputQueue, methodParams);
                    }
                    else
                    {
                        comp.onServerStatePassive(componentState, this.serverTime);
                    }
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
            clientData.ix = this.inputIndexCounter.next();

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
