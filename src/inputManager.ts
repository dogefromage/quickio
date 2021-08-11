
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
    return new Date().getTime() * 0.001;
}

export class InputManager
{
    private channels: InputChannel[] = [];

    constructor()
    {
        addEventListener('keydown', (e: KeyboardEvent) =>
        {
            for (let channel of this.channels)
            {
                channel.setKeyDown(e.code);
            }
        });

        addEventListener('keyup', (e: KeyboardEvent) =>
        {
            for (let channel of this.channels)
            {
                channel.setKeyUp(e.code);
            }
        });
    }
    
    createChannel()
    {
        let channel = new InputChannel();
        this.channels.push(channel);
        return channel;
    }

    deleteChannel(channel: InputChannel)
    {
        this.channels = this.channels.filter((c) => c != channel);
    }

    clearAllChannels()
    {
        this.channels = [];
    }
}

export class InputChannel
{
    private keys = new Map<string, Key>();

    constructor()
    {

    }

    /** @internal */
    setKeyDown(code: string)
    {
        let key = this.keys.get(code);

        if (key === undefined)
        {
            key = 
            {
                timeWhenPressed: 0,
                downTime: 0,
                pressed: false,
            };
        }

        if ( !key.pressed )
        {
            key.timeWhenPressed = getTime();
            key.pressed = true;

            this.keys.set(code, key);
        }
    }

    /** @internal */
    setKeyUp(code: string)
    {
        let key = this.keys.get(code);

        if (key !== undefined)
        {
            key.pressed = false;

            key.downTime = getTime() - key.timeWhenPressed;

            this.keys.set(code, key);
        };
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
                let downTime = key.downTime;
                key.downTime = 0;
                
                return downTime;
            }
        }
    }
}