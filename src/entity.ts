import { Component, ComponentClass } from './component';
import { ECS } from './systems/ecs';

/**
 * The **Entity** class is essentially a storage container for {@link Component}s. A entity can e.g. be a **Player**, while it contains components like a **PlayerController**.
 * 
 * **Entities** should not be created using the constructor. To create an **entity**, use the {@link ECS.createEntity} Method:
 * 
 * ```ts
 * // Create entity on entity component system
 * let myEntity = someEcs.createEntity(optionalId);
 * 
 * // Retrieve existing entity from system
 * let otherEntity = someEcs.getEntityById(id);
 * 
 * // delete an entity by id
 * someEcs.deleteEntityById(myEntity.id);
 * 
 * // or, delete by passing the entity object
 * someEcs.delete(myEntity);
 * ```
 */
export class Entity
{
    /** @internal */
    components: Component[] = [];
    
    /**
     * This value will get set to **false** after this entity has been destroyed. Check this boolean to ensure the existence of an entity.
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

    /**
     * This method will return a component of the passed type which is attached to this entity. 
     * If no component exists, the return value will be undefined. 
     * This method is analogous to {@link Component.getComponent}.
     */
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

    /**
     * This method will return **true** or **false** respectively if a component of the passed type is attached to this entity. 
     * This method is analogous to {@link Component.hasComponent}.
     */
    hasComponent<T extends Component>(componentClass: ComponentClass<T>)
    {
        return this.getComponent(componentClass) != null;
    }

    /**
     * This method will add an instance of the passed component type to this entity or return a component if it already exists on this entity.
     * This Method is analogous to {@link Component.addComponent}.
     * 
     * ```ts
     * // example: attach a PlayerController component to a player entity
     * 
     * const playerController = playerEntity.addComponent(PlayerController);
     * ```
     */
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
        c.init(this.ecs.getComponentMethodParams());
        c.hasRunInit = true;
        this.ecs.subscribeComponent(componentClass, c);
        this.components.push(c);

        return c;
    }
}
