import { Game2d } from "./game";

export class Component
{
    private _isAttachedToEntity = true;
    /**
     * This property will get set to false after the component has been removed from its entity. If your component is referenced somewhere else, it may be useful to check if the component is still attached.
     */
    get isAttachedToEntity()
    {
        return this._isAttachedToEntity;
    }

    constructor(
        public game: Game2d,
        public entity: Entity
        )
    {

    }

    start()
    {
        
    }

    update()
    {
        
    }

    onDestroy()
    {

    }

    getComponent<T extends Component>(componentType: new (game: Game2d, entity: Entity) => T)
    {
        return this.entity.getComponent(componentType);
    }

    hasComponent<T extends Component>(componentType: new (game: Game2d, entity: Entity) => T)
    {
        return this.entity.hasComponent(componentType);
    }

    addComponent<T extends Component>(componentType: new (game: Game2d, entity: Entity) => T)
    {
        return this.entity.addComponent(componentType);
    }

    removeComponent<T extends Component>(componentType: new (game: Game2d, entity: Entity) => T)
    {
        return this.entity.removeComponent(componentType);
    }

    /** @internal */
    onDestroyInternal()
    {
        this._isAttachedToEntity = false;
    }
}

export class Entity
{
    constructor(private game: Game2d)
    {
        
    }

    private components: Component[] = [];

    getComponent<T extends Component>(componentType: new (game: Game2d, entity: Entity) => T)
    {
        for (let i = 0; i < this.components.length; i++)
        {
            if (this.components[i] instanceof componentType)
            {
                return <T>this.components[i];
            }
        }

        console.error(`Component ${componentType.name} was not found on entity! Use addComponent() to create a new one or use hasComponent() to check its existence beforehand. This function could have also run before the component was attached to this entity, so check your order of execution.`)

        return <T><unknown>undefined;
    }

    hasComponent<T extends Component>(componentType: new (game: Game2d, entity: Entity) => T)
    {
        for (let i = 0; i < this.components.length; i++)
        {
            if (this.components[i] instanceof componentType)
            {
                return true;
            }
        }

        return false;
    }

    addComponent<T extends Component>(componentType: new (game: Game2d, entity: Entity) => T)
    {
        let c: any;
        for (let i = 0; i < this.components.length; i++)
        {
            if (this.components[i] instanceof componentType)
            {
                c = this.components[i];
            }
        }

        if (c === undefined)
        {
            // create new component
            c = new componentType(this.game, this);
            c.start();
            this.game.subscribeComponent(componentType, c);
            this.components.push(c);
        }
        else
        {
            console.warn(`Component ${componentType.name} has already been added to this entity. The previous component will be returned.`);
        }

        return <T>c;
    }

    removeComponent<T extends Component>(componentType: new (game: Game2d, entity: Entity) => T)
    {
        for (let i = 0; i < this.components.length; i++)
        {
            if (this.components[i] instanceof componentType)
            {
                let c = this.components.splice(i, 1)[0];
                c.onDestroy();
                c.onDestroyInternal();

                this.game.unsubscribeComponent(componentType, c);

                return true;
            }
        }

        return false;
    }

    removeAllComponents()
    {
        for (let i = 0; i < this.components.length; i++)
        {
            let c = this.components[i];
            c.onDestroy();
            c.onDestroyInternal();
            
            // should work???
            let constructorFunction = Object.getPrototypeOf(c).constructor;
            this.game.unsubscribeComponent(constructorFunction, c);
        }

        this.components = [];
    }
}

// export class Entity
// {
//     constructor(private game: Game)
//     {
        
//     }

//     private components = new Map<typeof Component, Component>();

//     getComponent<T extends Component>(componentType: new (game: Game, entity: Entity) => T)
//     {
//         return <T>this.components.get(componentType);
//     }

//     addComponent<T extends Component>(componentType: new (game: Game, entity: Entity) => T)
//     {
//         let c = this.components.get(componentType);

//         if (c === undefined)
//         {
//             c = new componentType(this.game, this);
//             c.start();
            
//             this.game.subscribeComponent(componentType, c);
            
//             this.components.set(componentType, c);
//         }

//         return <T>c;
//     }

//     removeComponent<T extends Component>(componentType: new (game: Game, entity: Entity) => T)
//     {
//         let c = this.components.get(componentType);

//         if (c === undefined)
//         {
//             return;
//         }

//         c.onDestroy();

//         this.game.unsubscribeComponent(componentType, c);
//         return this.components.delete(componentType);
//     }

//     removeAllComponents()
//     {
//         for (let [ cType, c ] of this.components)
//         {
//             this.removeComponent(cType);
//         }
//     }
// }
