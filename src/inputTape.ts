import { KeyCode, KeyData } from "./inputChannel";

export interface InputDelta
{
    keys?: [
        on: KeyCode[],
        off: KeyCode[],
        triggers: KeyCode[],
    ]
};

export interface InputData
{
    timeStamp: number;
    pressedKeys?: KeyCode[];
}

function searchTimeStamp(tape: Array<InputData>, regionStart: number, regionEnd: number)
{
    
}

export class InputTape
{
    private inputTape: Array<InputData | null>;

    private _tapeHead = 0;
    private get tapeHead()
    {
        return this._tapeHead;
    }
    private set tapeHead(newValue: number)
    {
        this._tapeHead = newValue % this.tapeLength;
    }

    private get tapeEnd()
    {
        return (this.tapeHead + 1) % this.tapeLength;
    }

    constructor(
        private tapeLength = 256
    )
    {
        this.inputTape = 
            new Array<InputData | null>(tapeLength)
                .fill(null);
    }

    write(input: InputData)
    {
        this.tapeHead++;
        this.inputTape[this.tapeHead] = input;
    }

    calculateDelta(startTime: number, endTime?: number)
    {
        let inputDelta: InputDelta = 
        {
            keys: [ [], [], [] ]
        }

        

        return inputDelta;
    }
}