
import { Key as Keys } from 'ts-key-enum';
export { Keys };

interface Key
{
    timeWhenPressed: number;
    downTime: number;
    pressed: boolean;
};

function getTime()
{
    return 0.001 * new Date().getTime();
}

export class InputManager
{
    private keys = new Map<string, Key>();

    constructor()
    {
        addEventListener('keydown', (e: KeyboardEvent) =>
        {
            let key = this.keys.get(e.code);

            if (key === undefined)
            {
                key = 
                {
                    timeWhenPressed: 0,
                    downTime: 0,
                    pressed: false,
                };
            }
                
            key.timeWhenPressed = getTime();
            key.pressed = true;

            this.keys.set(e.code, key);
        });

        addEventListener('keyup', (e: KeyboardEvent) =>
        {
            let key = this.keys.get(e.code);

            if (key !== undefined)
            {
                key.pressed = false;

                key.downTime = getTime() - key.timeWhenPressed;

                this.keys.set(e.code, key);
            };

        });
    }

    isKeyPressed(code: string)
    {
        let key = this.keys.get(code);
        
        return key?.pressed || false;
    }

    getKeyDownTime(code: string)
    {
        let key = this.keys.get(code);

        if (key === undefined)
        {
            return 0;
        }
        else
        {
            if (key.pressed)
            {
                let currTime = getTime();
                let partialDownTime = currTime - key.timeWhenPressed;
                key.timeWhenPressed = currTime;
                return partialDownTime;
            }
            else
            {
                return key.downTime;
            }
        }
    }
}
