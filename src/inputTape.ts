import { runInThisContext } from "vm";
import { KeyCode, KeyData } from "./inputChannel";

export interface InputData
{
    /** start time */
    st: number;
    /** delta time */
    dt: number;
    keys?: number[];
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

    /**
     * Returns entry with the closest time stamp smaller than the time passed as argument
     */
    searchByTime(time: number)
    {
        let lastIndex = -1;
        for (let i = 0; i < this.tapeLength; i++)
        {
            let index = this.tapeHead - i;
            while (index < 0) index += this.tapeLength;
            
            let data = this.inputTape[index];

            if (!data) { return lastIndex; }

            if (data.st < time)
            {
                return index;
            }

            lastIndex = index;
        }

        return lastIndex;
    }

    getInputFromTimeSpan(startTime: number, endTime?: number): InputData
    {
        let keyMap = new Map<number, number>();

        let totalDuration = 0;

        let endIndex = this.tapeEnd;
        if (endTime)
        {
            endIndex = this.searchByTime(endTime);
        }
        let startIndex = this.searchByTime(startTime);

        while (endIndex < startIndex) endIndex += this.tapeLength; 

        for (let i = startIndex; i < endIndex; i++)
        {
            let data = this.inputTape[i % this.tapeLength];
            if (!data) continue;
            
            totalDuration += data.dt;
            if (!data.keys) continue;

            for (let i = 0; i < data.keys.length; i += 2)
            {
                let key = data.keys[i];
                let factor = data.keys[i + 1] * data.dt;

                keyMap.set(key, 
                    (keyMap.get(key) || 0) + factor);
            }
        }

        let keys = [];
        for (const [ key, factor ] of keyMap)
        {
            keys.push(key, factor / totalDuration);
        }

        return {
            st: startTime,
            dt: totalDuration,
            keys
        };
    }
}