import { InputChannel, KeyCodes } from "."

export interface InputConfiguration
{
    recordKeys: number[],
    recordMouse: boolean,
};

export class InputListener
{
    private channels = new Set<InputChannel>();
    
    addChannel(channel: InputChannel)
    {
        return this.channels.add(channel);
    }

    removeChannel(channel: InputChannel)
    {
        return this.channels.delete(channel);
    }
    
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

    constructor() 
    {
        document.addEventListener('keydown', e => this.handleKeyDown(e));
        document.addEventListener('keyup', e => this.handleKeyUp(e));
        document.addEventListener('mousemove', e => this.handleMouseMove(e));
    }

    handleKeyUp(e: KeyboardEvent)
    {
        if (this.inputConfig.recordKeys.includes(e.keyCode))
        {
            this.channels.forEach(c => c.setKeyUp(e.keyCode));
        }
    }

    handleKeyDown(e: KeyboardEvent)
    {
        if (this.inputConfig.recordKeys.includes(e.keyCode))
        {
            this.channels.forEach(c => c.setKeyDown(e.keyCode));
        }
    }

    handleMouseMove(e: MouseEvent)
    {
        if (this.inputConfig.recordMouse)
        {
            console.warn('gagi');
        }
    }
}