import { Component, ComponentClass } from './component';
import { ECS } from './systems/ecs';

export class Entity
{
    /** @internal */
    components: Component[] = [];
    
    /**
     * This value will get set to false after this entity has been destroyed. Checking this boolean to ensure the class exists, can help eliminate errors.
     */
    isDestroyed = false;

    get id() { return this._id; }

    /**
     * @ignore
     */
    constructor(
        public ecs: ECS,
        private _id: string
    ) {}

    getComponent<T extends Component>(componentClass: ComponentClass<T>)
    {
        for (const component of this.components)
        {
            if (component instanceof componentClass)
            {
                return component;
            }
        }
    }

    hasComponent<T extends Component>(componentClass: ComponentClass<T>)
    {
        return this.getComponent(componentClass) != null;
    }

    addComponent<T extends Component>(componentClass: ComponentClass<T>)
    {
        let c = this.getComponent(componentClass);
        if (c != null)
        {
            console.warn(`Component ${componentClass.name} has already been added to this entity. The previous component will be returned.`);
            return c;
        }

        // create new component
        c = new componentClass(this.ecs, this);
        c.awake(this.ecs.localArgs);
        this.ecs.subscribeComponent(componentClass, c);
        this.components.push(c);

        return c;
    }
}
