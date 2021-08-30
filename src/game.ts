import { Component, Entity } from "./entity";
import { Renderer2d } from "./components/renderer";
import { InputChannel, InputManager } from "./inputManager";
import { Transform2d } from "./components/transform";
import { Vector2 } from "quickio-math";
import { RigidBody2d } from "./physics2d/rigidbody";
import { BiMap } from '@jsdsl/bimap';
import { CircleCollider, ColliderList } from "./physics2d/collider";
import { Physics2d } from "./physics2d/physics";
import { Debug } from "./debug";

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
    private knownComponents = new BiMap<string, typeof Component>();
    private defaultComponents: (typeof Component)[];

    public usePhysics = true;
    private physicsRelevantComponents = new Set<typeof Component>();
    private physics2d = new Physics2d(this);

    private inputManager = new InputManager();

    private renderingContext?: CanvasRenderingContext2D;

    private isRunning = false;

    public debug = new Debug();

    constructor()
    {
        this.startTime = this.lastTime = getTime();
        this._frameCount = this._deltaTime = 0;

        this.defaultComponents = [ Transform2d, Renderer2d ];

        this.physicsRelevantComponents.add(RigidBody2d);
        for (const colliderType of ColliderList)
        {
            this.physicsRelevantComponents.add(colliderType);
        }

        // init comps
        this.initializeComponent(Transform2d, 'transform2d');
        this.initializeComponent(Renderer2d, 'renderer2d');
        this.initializeComponent(RigidBody2d, 'rigidbody2d');
        this.initializeComponent(CircleCollider, 'circleCollider');
    }

    initializeComponent(componentClass: typeof Component, uniqueName: string)
    {
        if (this.knownComponents.hasKey(uniqueName))
        {
            console.error(`Component with name '${uniqueName}' has already been initialized once. Choose a unique name for every component`);
        }
        else
        {
            this.knownComponents.set(uniqueName, componentClass);
        }
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
        let componentSet = this.componentSystem.get(componentType);

        if (componentSet !== undefined)
        {
            componentSet.add(component);
        }
        else
        {
            if (this.knownComponents.hasValue(componentType))
            {
                componentSet = new Set<Component>();
                this.componentSystem.set(componentType, componentSet);

                componentSet.add(component);
            }
            else
            {
                console.error(`Component ${componentType.name} has never been initialized. Use Game2d.initializeComponent() and assign a unique name`);
            }
        }
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

    getAllComponentsOfType<T extends Component>(componentType: new (game: Game2d, entity: Entity) => T)
    {
        let res = this.componentSystem.get(componentType);
        if (res === undefined)
        {
            return <T[]>[];
        }
        return <T[]>[ ...res ];
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
        /**
         * The main update loop:
         *  - calculate time
         *  - physics
         *      - rigidbody update
         *      - collisions
         *  - input
         *  - general update
         *      - update all components
         *  - rendering
         */

        let currentTime = new Date().getTime() * 0.001;
        this._deltaTime = currentTime - this.lastTime;

        ///////////////////// PHYSICS UPDATE /////////////////////
        if (this.usePhysics)
        {
            this.physics2d.update();
        }

        ///////////////////// GENERAL UPDATE /////////////////////
        for (let [ componentType, components ] of this.componentSystem)
        {
            let isPhysicsComponent = this.physicsRelevantComponents.has(componentType);
            if (!isPhysicsComponent)
            {
                for (let component of components)
                {
                    component.update();
                }
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
            r2d.render(ctx);
        }

        this.debug.draw(ctx);
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