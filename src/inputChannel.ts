import { KeyCodes, quickError } from "./utils";

type KeyData = 
{
    isPressed: boolean;
}

type KeyCode = number;

export type InputData =
{
    down?: KeyCode[];
    up?: KeyCode[];
}

export class InputChannel
{
    private keyData;

    private currentPressedKeys;
    private lastPressedKeys;

    private saved?: {
        keyData: Map<KeyCode, KeyData>,
        currentPressedKeys: Set<KeyCode>,
        lastPressedKeys: Set<KeyCode>,
    };

    constructor(
        public id: string,
    )
    {
        this.keyData = new Map<KeyCode, KeyData>();
        
        this.currentPressedKeys = new Set<KeyCode>();
        this.lastPressedKeys = new Set<KeyCode>();
    }

    /** @internal */
    save()
    {
        this.saved = {
            keyData: new Map([ ...this.keyData ]),
            currentPressedKeys: new Set([ ...this.currentPressedKeys ]),
            lastPressedKeys: new Set([ ...this.lastPressedKeys ]),
        };
    }

    /** @internal */
    restore()
    {
        if (!this.saved) return;

        this.keyData = this.saved.keyData;
        this.currentPressedKeys = this.saved.currentPressedKeys;
        this.lastPressedKeys = this.lastPressedKeys;

        this.saved = undefined;
    }

    setKeyDown(code: KeyCode)
    {
        if (typeof(code) !== 'number') quickError(`Keycode type must be number`);
        
        this.keyData.set(code, {
            isPressed: true,
        });
        this.currentPressedKeys.add(code);
    }

    setKeyUp(code: KeyCode)
    {
        if (typeof(code) !== 'number') quickError(`Keycode type must be number`);
        
        let key = this.keyData.get(code);
        if (key != null)
        {
            key.isPressed = false;
        };
    }

    update()
    {
        for (const [ code, keyData ] of this.keyData)
        {
            if (!keyData.isPressed)
            {
                this.currentPressedKeys.delete(code);
            }
        }
    }

    getDataAndUpdate()
    {
        const data: InputData = 
        {
            
        };

        // in last set but not in current set => set off
        let off = [ ...this.lastPressedKeys ]
            .filter(code => !this.currentPressedKeys.has(code));
        if (off.length > 0) data.up = off;

        // in current set but not in last set => set on
        let on = [ ...this.currentPressedKeys ]
            .filter(code => !this.lastPressedKeys.has(code));
        if (on.length > 0) data.down = on;

        // update last
        this.lastPressedKeys = new Set([ ...this.currentPressedKeys ]);

        // clear old keys
        this.update();

        if (Object.entries(data).length > 0)
        {
            return data;
        }
    }

    setDataAndUpdate(inputData: InputData)
    {
        for (const key of inputData.up || [])
        {
            this.setKeyUp(key);
        }

        for (const key of inputData.down || [])
        {
            this.setKeyDown(key);
        }

        this.update();
    }

    isKeyPressed(code: KeyCode)
    {
        return this.currentPressedKeys.has(code);
    }

    calculateAxes(wasd = true, arrows = false)
    {
        let left, up, right, down;

        if (wasd)
        {
            left = this.isKeyPressed(KeyCodes.KeyA);
            up = this.isKeyPressed(KeyCodes.KeyW);
            right = this.isKeyPressed(KeyCodes.KeyD);
            down = this.isKeyPressed(KeyCodes.KeyS);
        }
        
        if (arrows)
        {
            left ||= this.isKeyPressed(KeyCodes.ArrowLeft);
            up ||= this.isKeyPressed(KeyCodes.ArrowUp);
            right ||= this.isKeyPressed(KeyCodes.ArrowRight);
            down ||= this.isKeyPressed(KeyCodes.ArrowDown);
        }

        return {
            x: (right ? 1 : 0) - (left ? 1 : 0),
            y: (up ? 1 : 0) - (down ? 1 : 0),
        }
    }
}











// type PressedKey =
// {
//     timeWhenPressed: number;
//     downTime: number;
//     pressed: boolean;
// };

// export class InputChannel
// {
//     private keys = new Map<string, PressedKey>();

//     constructor()
//     {

//     }

//     /** @internal */
//     setKeyDown(code: string)
//     {
//         let key = this.keys.get(code);

//         if (key === undefined)
//         {
//             key = 
//             {
//                 timeWhenPressed: 0,
//                 downTime: 0,
//                 pressed: false,
//             };
//         }

//         if ( !key.pressed )
//         {
//             key.timeWhenPressed = getTime();
//             key.pressed = true;

//             this.keys.set(code, key);
//         }
//     }

//     /** @internal */
//     setKeyUp(code: string)
//     {
//         let key = this.keys.get(code);

//         if (key !== undefined)
//         {
//             key.pressed = false;

//             key.downTime = getTime() - key.timeWhenPressed;

//             this.keys.set(code, key);
//         };
//     }

//     isKeyPressed(code: string)
//     {
//         let key = this.keys.get(code);
        
//         return key?.pressed || false;
//     }

//     getKeyDownTime(code: string)
//     {
//         let key = this.keys.get(code);

//         if (key === undefined)
//         {
//             return 0;
//         }
//         else
//         {
//             if (key.pressed)
//             {
//                 let currTime = getTime(); 
//                 let partialDownTime = currTime - key.timeWhenPressed;
//                 key.timeWhenPressed = currTime;
                
//                 return partialDownTime;
//             }
//             else
//             {
//                 let downTime = key.downTime;
//                 key.downTime = 0;
                
//                 return downTime;
//             }
//         }
//     }
// }
