import { Game2d } from "./game";

export class Component
{
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
}

class ComponentError extends Error
{
    constructor(msg: string)
    {
        super(msg);
        this.name = 'ComponentError';
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

        throw new ComponentError(`Component ${componentType.name} was not found on entity! Use addComponent to create a new one or check you order of execution. This function could have run before the component was attached to this entity.`);
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
