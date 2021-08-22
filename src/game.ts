import { Component, Entity } from "./entity";
import { Renderer2d } from "./components/renderer";
import { InputChannel, InputManager } from "./inputManager";
import { Transform2d } from "./components/transform";
import { Vector2 } from "quickio-math";
import { request } from "http";
import { RigidBody2d } from "./components/rigidbody";

function getTime()
{
    return new Date().getTime() * 0.001;
}

export class Game2d
{
    // time
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

    // constants
    private _constants = 
    {
        g: new Vector2([ 0, 10 ]),
    };
    get constants()
    {
        return this._constants;
    }

    private entities = new Set<Entity>();
    private componentSystem = new Map<typeof Component, Set<Component>>();
    
    private defaultComponents: (typeof Component)[];
    
    private inputManager = new InputManager();

    private renderingContext?: CanvasRenderingContext2D;

    private isRunning = false;

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

    setRenderingContext(ctx: CanvasRenderingContext2D)
    {
        this.renderingContext = ctx;
    }

    clearRenderingContext()
    {
        this.renderingContext = undefined;
    }

    start()
    {
        this.isRunning = true;
        this.lastTime = getTime();
        requestAnimationFrame(() => { this.update() });
    }

    stop()
    {
        this.isRunning = false;
    }

    /** @internal */
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

    /** @internal */
    unsubscribeComponent(componentType: typeof Component, component: Component)
    {
        let componentList = this.componentSystem.get(componentType);

        if (componentList !== undefined)
        {
            componentList.delete(component);
        }
    }
    /** @internal */
    getAllComponentsOfType<T extends Component>(componentType: new (game: Game2d, entity: Entity) => T)
    {
        let res = this.componentSystem.get(componentType);
        if (res === undefined)
        {
            res = new Set<T>();
        }
        return <Set<T>>res;
    }
    
    addEntity()
    {
        let entity = new Entity(this);

        for (let i = 0; i < this.defaultComponents.length; i++)
        {
            entity.addComponent(this.defaultComponents[i]);
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

    physics()
    {
        let rigidbody2ds = this.getAllComponentsOfType(RigidBody2d);

        for (const r of rigidbody2ds)
        {
            r.update();
        }
    }

    update()
    {
        let currentTime = new Date().getTime() * 0.001;
        this._deltaTime = this.lastTime - currentTime;

        ///////////////////// PHYSICS UPDATE /////////////////////
        this.physics();

        ///////////////////// GENERAL UPDATE /////////////////////
        for (let [ componentType, components ] of this.componentSystem)
        {
            if (componentType === RigidBody2d)
            {
                continue;
            }

            for (let component of components)
            {
                component.update();
            }
        }

        ///////////////////// RENDERING /////////////////////
        if (this.renderingContext === undefined)
        {
            warnNoCtx();
        }
        else
        {
            this.render(this.renderingContext);
        }

        this.lastTime = currentTime;
        this._frameCount++;

        if (this.isRunning)
        {
            requestAnimationFrame(() => { this.update() });
        }
    }

    render(ctx: CanvasRenderingContext2D)
    {
        let renderer2ds = this.getAllComponentsOfType(Renderer2d);

        let r2dsList = [];

        for (let r2d of renderer2ds)
        {
            r2dsList.push(r2d);
        }

        // sort by depth
        r2dsList = r2dsList.sort((a, b) => a.zDepth - b.zDepth);

        for (let r2d of r2dsList)
        {
            let m = r2d.transform.transformationMatrix.all();

            ctx.save();
            ctx.transform(m[0], m[3], m[1], m[4], m[2], m[5]);
            
            r2d.render(ctx);

            ctx.restore();
        }
    }
}


let hasWarnedCtx = false;
function warnNoCtx()
{
    if (!hasWarnedCtx)
    {
        console.warn('No rendering context is set on the main game object. Use setRenderingContext() to set the CanvasRenderingContext2d of your html5 canvas');
        hasWarnedCtx = true;
    }
}