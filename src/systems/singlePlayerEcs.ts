import { ActiveComponent } from "..";
import { BrowserECS } from "./browserEcs";
import { ECS } from "./ecs";
import { ComponentArrayItem, LocalArgs } from "./ecsTypes";

export class SinglePlayerECS extends BrowserECS
{
    constructor(componentList: ComponentArrayItem[], localArgs: LocalArgs)
    {
        // will send input updates to default input channel
        super(componentList, localArgs, ECS.defaultInputChannelName);
    }

    update()
    {
        this._time.update();

        const methodParams = this.getComponentMethodParams();

        for (const componentRow of this.components)
        {
            for (let component of componentRow.instances)
            {
                if (!component.hasRunStart)
                {
                    component.start(methodParams);
                    component.hasRunStart = true;
                }
            }
        }

        for (const componentRow of this.components)
        {
            for (let component of componentRow.instances)
            {
                if (component instanceof ActiveComponent)
                {
                    component.activeUpdate(methodParams);
                }

                component.update(methodParams);
            }
        }

        for (const componentRow of this.components)
        {
            for (let component of componentRow.instances)
            {
                component.render(methodParams);
            }
        }
    }
}

