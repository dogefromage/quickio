import { Component, ComponentMethodParams, ComponentState } from ".";
import { InputData } from "./inputChannel";
import { Time } from './time';

interface InputQueueItem
{
    time: Time;
    input: InputData;
    index: number;
}

export class ActiveComponent extends Component
{
    /** @internal */
    inputQueue: InputQueueItem[] = [];

    onServerState(serverState: ComponentState, dataIndex: number, serverTime: Time)
    {
        let methodParams = this.ecs.getComponentMethodParams();
        
        // cut off old part from stateQueue
        while (
            this.inputQueue.length === 0 &&
            dataIndex < this.inputQueue[0].index
        )
        {
            this.inputQueue.shift();
        }

        // set initial state
        this.setState(serverState);

        this.input.save();

        // simulate forwards
        for (let i = 0; i < this.inputQueue.length; i++)
        {
            let queueItem = this.inputQueue[i];

            this.input.setDataAndUpdate(queueItem.input);

            methodParams.time = queueItem.time;
            this.activeUpdate(methodParams);
        }

        this.input.restore();
    }

    activeUpdate(componentMethodParams: ComponentMethodParams) {}
}
