import { setUncaughtExceptionCaptureCallback } from "process";
import { KeyCodes } from "../utils";
import { ECS } from "./ecs"
import { ComponentArrayItem, LocalArgs } from "./ecsTypes";

export interface InputConfiguration
{
    recordKeys: number[],
    recordMouse: boolean,
};

/**
 * @hidden
 */
export abstract class BrowserECS extends ECS
{
    protected localInputChannel;
    
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

    constructor(
        componentList: ComponentArrayItem[],
        localArgs: LocalArgs,
        localInputChannelId: string,
    )
    {
        super(componentList, localArgs);

        this.localInputChannel = this.createInputChannel(localInputChannelId);

        document.addEventListener('keydown', e => this.handleKeyDown(e));
        document.addEventListener('keyup', e => this.handleKeyUp(e));
        document.addEventListener('mousemove', e => this.handleMouseMove(e));
    }

    /** @internal */
    handleKeyUp(e: KeyboardEvent)
    {
        if (this.inputConfig.recordKeys.includes(e.keyCode))
        {
            this.localInputChannel.setKeyUp(e.keyCode);
        }
    }

    /** @internal */
    handleKeyDown(e: KeyboardEvent)
    {
        if (this.inputConfig.recordKeys.includes(e.keyCode))
        {
            this.localInputChannel.setKeyDown(e.keyCode);
        }
    }

    /** @internal */
    handleMouseMove(e: MouseEvent)
    {
        if (this.inputConfig.recordMouse)
        {
            console.warn('gagi');
        }
    }
}