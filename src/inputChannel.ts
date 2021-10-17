
type KeyData = 
{
    isPressed: boolean;
}

type KeyCode = number;

export type InputData =
{
    on?: KeyCode[];
    off?: KeyCode[];
}

export class InputChannel
{
    private keyData;

    private currentPressedKeys;
    private lastPressedKeys;

    constructor(
        public id: string,
    )
    {
        this.keyData = new Map<KeyCode, KeyData>();
        
        this.currentPressedKeys = new Set<KeyCode>();
        this.lastPressedKeys = new Set<KeyCode>();
    }

    setKeyDown(code: KeyCode)
    {
        this.keyData.set(code, {
            isPressed: true,
        });
        this.currentPressedKeys.add(code);
    }

    setKeyUp(code: KeyCode)
    {
        let key = this.keyData.get(code);

        if (key != null)
        {
            key.isPressed = false;
        };
    }

    clear()
    {
        for (const [ code, keyData ] of this.keyData)
        {
            if (!keyData.isPressed)
            {
                this.currentPressedKeys.delete(code);
            }
        }
    }

    getDataAndClear()
    {
        const data: InputData = 
        {
            
        };

        // in last set but not in current set => set off
        let off = [ ...this.lastPressedKeys ]
            .filter(code => !this.currentPressedKeys.has(code));
        if (off.length > 0) data.off = off;

        // in current set but not in last set => set on
        let on = [ ...this.currentPressedKeys ]
            .filter(code => !this.lastPressedKeys.has(code));
        if (on.length > 0) data.on = on;

        // update last
        this.lastPressedKeys = new Set([ ...this.currentPressedKeys ]);

        // clear old keys
        this.clear();

        if (Object.entries(data).length > 0)
        {
            return data;
        }
    }

    isKeyPressed(code: KeyCode)
    {
        return this.currentPressedKeys.has(code);
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
