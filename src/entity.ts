import { Component, ComponentClass } from './component';
import { ECS } from './ecs';

export class Entity
{
    /** @internal */
    components: Component[] = [];
    
    isDestroyed = false;

    get id() { return this._id; }

    constructor(
        public ecs: ECS,
        private _id: string
    )
    {
        
    }

    getComponent<T extends Component>(componentType: ComponentClass<T>)
    {
        for (const component of this.components)
        {
            if (component instanceof componentType)
            {
                return component;
            }
        }
    }

    hasComponent<T extends Component>(componentType: ComponentClass<T>)
    {
        return this.getComponent(componentType) != null;
    }

    addComponent<T extends Component>(componentType: ComponentClass<T>)
    {
        let c = this.getComponent(componentType);
        if (c != null)
        {
            console.warn(`Component ${componentType.name} has already been added to this entity. The previous component will be returned.`);
            return c;
        }

        // create new component
        c = new componentType(this.ecs, this);
        c.awake();
        this.ecs.subscribeComponent(componentType, c);
        this.components.push(c);

        return c;
    }

    // removeCom ponent<T extends Component>(componentType: ComponentClass<T>)
    // {
    //     for (let i = 0; i < this.components.length; i++)
    //     {
    //         if (this.components[i] instanceof componentType)
    //         {
    //             let c = this.components.splice(i, 1)[0];
    //             this.ecs.unsubscribeComponent(componentType, c);
    //             c.dispose();
    //             return true;
    //         }
    //     }

    //     return false;
    // }
}
