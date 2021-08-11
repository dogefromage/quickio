import { Component, Entity } from "./entity";
import { Renderer2d } from "./components/renderer";
import { InputChannel, InputManager } from "./inputManager";
import { Transform2d } from "./components/transform";

let nextKey = function*() 
{
    let i = 0;
    while (true)
    {
        yield i;
        i++;
    }
}();

function getTime()
{
    return new Date().getTime() * 0.001;
}

export class Game
{
    private lastTime: number;
    private startTime: number;
    private _frameCount: number;
    private _deltaTime: number;

    get deltaTime()
    {
        return this._deltaTime;
    }
    get frameCount()
    {
        return this._frameCount;
    }
    get gameTime()
    {
        return getTime() - this.startTime;
    }

    private entities = new Set<Entity>();
    private componentSystem = new Map<typeof Component, Set<Component>>();
    
    private defaultComponents: (typeof Component)[];
    
    private inputManager = new InputManager();

    constructor()
    {
        this.startTime = this.lastTime = getTime();
        this._frameCount = this._deltaTime = 0;

        this.defaultComponents = [ Transform2d, Renderer2d ];
    }

    createInputChannel()
    {
        return this.inputManager.createChannel();
    }

    deleteInputChannel(channel: InputChannel)
    {
        this.inputManager.deleteChannel(channel);
    }

    setDefaultComponents(defaultComponentList: (typeof Component)[])
    {
        this.defaultComponents = defaultComponentList;
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
        let entity = new Entity(this);

        for (let c of this.defaultComponents)
        {
            entity.addComponent(c);
        }

        this.entities.add(entity);

        return entity;
    }

    removeEntity(entity: Entity)
    {
        this.entities.delete(entity);
        if (entity !== undefined)
        {
            entity.removeAllComponents();
        }
    }
    
    update()
    {
        let currentTime = new Date().getTime() * 0.001;
        this._deltaTime = this.lastTime - currentTime;

        for (let [ componentType, components ] of this.componentSystem)
        {
            for (let component of components)
            {
                component.update();
            }
        }

        this.lastTime = currentTime;
        this._frameCount++;
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
