import { Component, Entity } from "./entity";
import { Renderer2d } from "./components/renderer";

function getTime()
{
    return new Date().getTime() * 0.001;
}

let nextKey = function*() 
{
    let i = 0;
    while (true)
    {
        yield i;
        i++;
    }
}();

export class Game
{
    private lastTime = getTime();

    private entities = new Set<Entity>();
    private componentSystem = new Map<typeof Component, Set<Component>>();

    constructor()
    {
        
    }

    subscribeComponent(componentType: typeof Component, component: Component)
    {
        let componentList = this.componentSystem.get(componentType);

        if (componentList === undefined)
        {
            componentList = new Set<Component>();
            this.componentSystem.set(componentType, componentList);
        }

        componentList.add(component);
    }

    unsubscribeComponent(componentType: typeof Component, component: Component)
    {
        let componentList = this.componentSystem.get(componentType);

        if (componentList !== undefined)
        {
            componentList.delete(component);
        }
    }
    
    addEntity()
    {
        // let key = nextKey.next().value;

        let entity = new Entity(this);

        // this.entities.set(key, entity);
        this.entities.add(entity);

        return entity;
    }

    removeEntity(entity: Entity)
    // removeEntity(key: number)
    {
        this.entities.delete(entity);
        // let entity = this.entities.get(key);
        if (entity !== undefined)
        {
            entity.removeAllComponents();
            // this.entities.delete(key);
        }
    }
    
    update()
    {
        let currentTime = getTime();
        let dt = this.lastTime - currentTime;

        for (let [ componentType, components ] of this.componentSystem)
        {
            for (let component of components)
            {
                component.update(this, dt);
            }
        }

        this.lastTime = currentTime;
    }

    render(ctx: CanvasRenderingContext2D)
    {
        let renderer2ds = this.componentSystem.get(Renderer2d);
        if (renderer2ds !== undefined)
        {
            for (let component of renderer2ds)
            {
                (<Renderer2d>component).render(ctx);
            }
        }

    }
}



