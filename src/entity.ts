import Component from './component';
import { ECS } from './ecs';

export default class Entity
{
    private components: Component[] = [];
    
    get id() { return this._id; }

    constructor(
        private ecs: ECS,
        private _id: string
    )
    {
        
    }

    getComponent<T extends Component>(componentType: typeof Component)
    {
        for (const component of this.components)
        {
            if (component instanceof componentType)
            {
                return component;
            }
        }

        console.error(`Component ${componentType.name} was not found on entity! Use addComponent() to create a new one or use hasComponent() to check its existence beforehand. This function could have also run before the component was attached to this entity, so check your order of execution.`)
    }

    hasComponent<T extends Component>(componentType: typeof Component)
    {
        return this.getComponent(componentType) != null;
    }

    addComponent<T extends Component>(componentType: typeof Component)
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

    removeComponent<T extends Component>(componentType: typeof Component)
    {
        for (let i = 0; i < this.components.length; i++)
        {
            if (this.components[i] instanceof componentType)
            {
                let c = this.components.splice(i, 1)[0];
                this.ecs.unsubscribeComponent(componentType, c);
                c.dispose();
                return true;
            }
        }

        return false;
    }

    dispose()
    {
        for (let i = 0; i < this.components.length; i++)
        {
            let c = this.components[i];
            c.dispose();
            
            // should work???
            let constructorFunction = Object.getPrototypeOf(c).constructor;
            this.ecs.unsubscribeComponent(constructorFunction, c);
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
