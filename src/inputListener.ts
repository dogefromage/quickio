import { InputTape, InputSlice } from './inputTape';
import { KeyCodes } from ".";
import { getUTCSeconds, quickError } from './utils';
import { Time } from './time';

export interface InputConfiguration
{
    recordKeys: number[],
    recordMouse: boolean,
};

interface PressedKey
{
    totalDownTime: number;
    lastPressedTime: number;
    isPressed: boolean;
}

export class InputListener
{
    private _inputConfig: InputConfiguration = {
        recordKeys: [ 
            KeyCodes.ArrowDown, KeyCodes.ArrowLeft, KeyCodes.ArrowUp, KeyCodes.ArrowRight,
        ],
        recordMouse: false,
    };
    get inputConfig()
    {
        return this._inputConfig;
    }

    private inputListenerTime = new Time();

    private keys = new Map<number, PressedKey>();

    constructor() 
    {
        document.addEventListener('keydown', e => this.handleKeyDown(e));
        document.addEventListener('keyup', e => this.handleKeyUp(e));
        // document.addEventListener('mousemove', e => this.handleMouseMove(e));
    }
    handleKeyDown(e: KeyboardEvent)
    {
        if (this.inputConfig.recordKeys.includes(e.keyCode))
        {
            let key = this.keys.get(e.keyCode);

            if (!key)
            {
                key = {
                    totalDownTime: 0,
                } as PressedKey
                this.keys.set(e.keyCode, key);
            }

            key.lastPressedTime = getUTCSeconds();
            key.isPressed = true;
        }
    }

    handleKeyUp(e: KeyboardEvent)
    {
        if (this.inputConfig.recordKeys.includes(e.keyCode))
        {
            let key = this.keys.get(e.keyCode)
            if (!key) return;

            key.isPressed = false;
            key.totalDownTime += getUTCSeconds() - key.lastPressedTime;
        }
    }

    // handleMouseMove(e: MouseEvent)
    // {
    //     if (this.inputConfig.recordMouse)
    //     {
    //         console.warn('gagi');
    //     }
    // }

    recordOntoTape(tape: InputTape)
    {
        this.inputListenerTime.update();
        let dt = this.inputListenerTime.dt;
        if (dt === 0) return quickError(`dt was 0`);
        let now = this.inputListenerTime.current;
        
        let inputSlice: InputSlice = {
            st: this.inputListenerTime.last,
            dt,
            keys: []
        };

        for (const [ keyCode, pressedKey ] of this.keys)
        {
            if (pressedKey.isPressed)
            {
                pressedKey.totalDownTime += now - pressedKey.lastPressedTime;
                pressedKey.lastPressedTime = now;
            }

            inputSlice.keys!.push(keyCode, pressedKey.totalDownTime / dt)
        }
        
        tape.write(inputSlice);
    }
}















// import { InputChannel, KeyCodes } from "."

// export interface InputConfiguration
// {
//     recordKeys: number[],
//     recordMouse: boolean,
// };

// export class InputListener
// {
//     private channels = new Set<InputChannel>();
    
//     addChannel(channel: InputChannel)
//     {
//         return this.channels.add(channel);
//     }

//     removeChannel(channel: InputChannel)
//     {
//         return this.channels.delete(channel);
//     }
    
//     private _inputConfig: InputConfiguration = {
//         recordKeys: [ 
//             KeyCodes.ArrowDown, KeyCodes.ArrowLeft, KeyCodes.ArrowUp, KeyCodes.ArrowRight,
//         ],
//         recordMouse: false,
//     };
//     get inputConfig()
//     {
//         return this._inputConfig;
//     }

//     constructor() 
//     {
//         document.addEventListener('keydown', e => this.handleKeyDown(e));
//         document.addEventListener('keyup', e => this.handleKeyUp(e));
//         document.addEventListener('mousemove', e => this.handleMouseMove(e));
//     }

//     handleKeyUp(e: KeyboardEvent)
//     {
//         if (this.inputConfig.recordKeys.includes(e.keyCode))
//         {
//             this.channels.forEach(c => c.setKeyUp(e.keyCode));
//         }
//     }

//     handleKeyDown(e: KeyboardEvent)
//     {
//         if (this.inputConfig.recordKeys.includes(e.keyCode))
//         {
//             this.channels.forEach(c => c.setKeyDown(e.keyCode));
//         }
//     }

//     handleMouseMove(e: MouseEvent)
//     {
//         if (this.inputConfig.recordMouse)
//         {
//             console.warn('gagi');
//         }
//     }
// }