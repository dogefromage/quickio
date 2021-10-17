import { ECS } from "./ecs";
import { ComponentArrayItem, LocalArgs } from "./ecsTypes";

export class SinglePlayerECS extends ECS
{
    constructor(componentList: ComponentArrayItem[], localArgs: LocalArgs)
    {
        super(componentList, localArgs);

        let defaultInputChannel = this.getDefaultInputChannel();
        document.addEventListener('keydown', (e: KeyboardEvent) =>
        {
            defaultInputChannel.setKeyDown(e.keyCode);
        });
        document.addEventListener('keyup', (e: KeyboardEvent) =>
        {
            defaultInputChannel.setKeyUp(e.keyCode);
        });
    }

    update()
    {
        super.update(true, true, true);
    }
}

