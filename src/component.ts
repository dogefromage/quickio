import { ECS } from './systems/ecs';
import { Entity } from './entity';
import { InputChannel } from './inputChannel';
import { quickError, quickWarn } from './utils';
import { calculateStateGradient, integrateState } from './componentState';
import { Time } from './time';

/**
 * This interface is used to describe the parameters of the following overloadable methods on a component.
 * {@link Component.init} 
 * {@link Component.start} 
 * {@link Component.update} 
 * {@link Component.render} 
 * {@link Component.onDestroy} 
 */
export interface ComponentMethodParams
{
    /**
     * This property will always contain the current time information.
     */
    time: Time;
    /**
     * This property will get set to the localArgs, which you passed into the constructor of the current ecs system. This allows you to send different local args to different systems, even if they use the same component.
     * For example: You can retrieve information like the html5 canvas context from your local args inside of the {@link Component.render} method even though the file will also run somewhere on the server, where the render() method is not called.
     */
    localArgs?: object;
}

type SerializableType = string | number | ComponentState;

/** @internal */
export type ComponentState = SerializableType[];

function isSerializable(value: SerializableType)
{
    if (Array.isArray(value))
    {
        for (const v of value)
        {
            if (!isSerializable(v))
            {
                return false;
            }
        }
        return true;
    }

    return typeof(value) === 'number' || typeof(value) === 'string';
}

/**
 * A custom sync property can be used if {@link Component.sync} alone doesn't suit your purpose.
 * It should be an object containing two methods, ***getProps()*** and ***setProps()***, which can be used the following way.
 * 
 * ```ts
 * let myVector = {
 *     x: 1, y: 2, z: 3,
 * };
 * 
 * 
 * let syncVector = {
 *     getProps: () => {
 *         return [ myVector.x, myVector.y, myVector.z ];
 *     },
 *     setProps: (state: ComponentState) => {
 *         myVector.x = state[0];
 *         myVector.y = state[1];
 *         myVector.z = state[2];
 *     }
 * }
 * 
 * // inside Component.init()
 * this.sync(syncVector); // add the pattern
 * 
 * ```
 * 
 * Why do I have to do this? Simple - Objects should be compressed as much as possible to safe bandwidth when sending data over the network. Quickio currently converts all data into JSON, which takes up more bytes for objects compared to simple arrays. Quickio also compressed floats down to less decimal points to reduce further unnessessary data.
 */
export interface CustomSyncProperty
{
    getProps: () => ComponentState,
    setProps: (state: ComponentState) => void,
}

export type SyncProperty = string | CustomSyncProperty;

function validateSyncProperty(prop: SyncProperty)
{
    if (typeof(prop) === 'string')
    {
        return;
    }

    if (typeof(prop as CustomSyncProperty) === 'object')
    {
        if (!prop.hasOwnProperty('getProps') ||
            !prop.hasOwnProperty('setProps'))
        {
            quickError("Objects as properties are only possible as CustomSyncProperties, which must include a getProps() and setProps function.", true);
        }
        return;
    }

    quickError('A sync property must be of type "string" or "CustomSyncProperty", which contains the methods "getProps" and "setProps"', true);
}

/** 
 * This type destribes the type of a component prototype.
 */
export type ComponentClass<T extends Component = Component> = 
    new (ecs: ECS, entity: Entity) => T;

/**
 * The Component class is where the magic happens. However, this class cannot be used in this form.
 * It should only be used to inherit from when building your custom components.
 * 
 * In an entity component system, components are always attached to an entity, therefore they cannot be nested.
 * 
 * ```ts
 * 
 * class MyComponent extends Component
 * {
 *     start()
 *     {
 *         // access the entity component system
 *         this.ecs
 * 
 *         // access the entity holding this component
 *         this.entity
 * 
 *         // your code here...
 *     }
 * }
 * 
 * ```
 * 
 * Components always feature the following emtpy method templates, which can be overwritten by your component. These methods will get called depending on situtation or environment:
 * 
 * {@link Component.init}\
 * {@link Component.start}\
 * {@link Component.update}\
 * {@link Component.render}
 * 
 * There also exist certain methods which will get called in special occasions.
 * 
 * {@link Component.onDestroy}
 */
export class Component
{
    /** @internal */
    hasRunStart = false;
    /** @internal */
    hasRunInit = false;

    /** @internal */
    syncProperties: SyncProperty[] = [];

    public isDestroyed;

    public input: InputChannel;

    /** @internal */
    stateGradient?: ComponentState;

    /** @internal */
    currentState?: ComponentState;

    /**
     * @ignore
     */
    constructor(
        public ecs: ECS,
        public entity: Entity
        )
    { 
        this.input = this.ecs.getDefaultInputChannel();
        this.isDestroyed = false;
    }

    /**
     * This method will **always** get called immediatly after instantiation of the component. Here, you should add all sync properties using <code>this.sync()</code>.
     */
    init(componentMethodParams: ComponentMethodParams) {}

    /**
     * The start method will get called once during the update function of your authorative entity component system. If you are using an authorative server, which sends data to clients, the start method **will only run on components on the server**.
     */
    start(componentMethodParams: ComponentMethodParams) {}

    /**
     * The update method will run every update cycle of your authorative entity component system. If you are using an authorative server, which sends data to clients, the update method **will only run on components on the server**.
     */
    update(componentMethodParams: ComponentMethodParams) {}

    /**
     * The render method will be called at the end of every update cycle of your ECS. It **will only run on ECS' inside of your browser**. 
     */
    render(componentMethodParams: ComponentMethodParams) {}

    onDestroy(componentMethodParams: ComponentMethodParams) {}

    useInputChannel(channel: InputChannel): void;
    useInputChannel(channelId: string): void;
    useInputChannel(obj: any)
    {
        let channel = obj as InputChannel | undefined;
        if (typeof(channel) === 'string')
        {
            channel = this.ecs.getInputChannel(obj);
        }

        if (channel == null)
        {
            quickWarn(`Input channel "${obj}" did not exist. Current input channel used.`);
            return;
        }
        this.input = channel;
    }

    sync(...syncProperties: SyncProperty[])
    {
        if (this.hasRunInit)
        {
            quickError(`sync() can only be called from the init() method. This ensures that all variables stay in sync`, true);
        }

        syncProperties.map(validateSyncProperty);

        this.syncProperties = this.syncProperties.concat(syncProperties);
    }

    onServerState(serverState: ComponentState, dataIndex: number, serverTime: Time)
    {
        if (!this.currentState)
        {
            this.currentState = serverState;
            return;
        }

        this.stateGradient = calculateStateGradient(this.currentState, serverState, serverTime.dtAverage);
    }

    interpolateState({ time }: ComponentMethodParams)
    {
        if (!this.currentState)
        {
            this.currentState = this.getState();
        }

        if (this.stateGradient)
        {
            this.currentState = integrateState(this.currentState, this.stateGradient, time.dt);
        }

        this.setState(this.currentState);
    }

    /**
     * This method is used internally to pack all sync-properties into an array in the order in which they where assigned. This method can be overwritten or the output can be modified using super.getState().
     * @returns Array of serialized sync vars
     */
    getState(): ComponentState
    {
        let state: ComponentState = [];

        for (const prop of this.syncProperties)
        {
            let value: any;

            if (typeof(prop) === 'string')
            {
                value = this.getProperty(prop);
            }

            if (typeof(prop) === 'object')
            {
                if (!prop.hasOwnProperty('getProps'))
                {
                    quickError('cannot call getProps on property', true);
                }
                value = prop.getProps();
            }

            if (value == null)
            {
                quickError(`syncProperty: '${prop}' was not found on object.`, true);
            }

            if (!isSerializable(value))
            {
                quickError(`Value: '${value}' of property ${prop} was not recognized as a serializable value. Valid types are stated as Type SerializableValue.`);
            }
            
            state.push(value);
        }

        return state;
    }

    setState(state: ComponentState) : void
    {
        let pointer = 0;

        for (const prop of this.syncProperties)
        {
            if (state[pointer] == null)
            {
                quickError(`Received state was smaller than expected. End of state array reached.`, true);
            }

            if (typeof(prop) === 'string')
            {
                this.setProperty(prop, state[pointer++]);
                continue;
            }

            if (typeof(prop) === 'object')
            {
                if (!prop.hasOwnProperty('setProps'))
                {
                    quickError('cannot call setProps on property', true);
                }

                let stateSection = state[pointer++] as ComponentState;
                if (!Array.isArray(stateSection))
                {
                    quickError(`Prop must be of type Array. type ${typeof(stateSection)} received instead.`, true);
                }

                prop.setProps(stateSection);
                continue;
            }
        }
    }

    /** @internal */
    getProperty(propertyName: string)
    {
        if ((<any>this)[propertyName] == null)
        {
            quickError(`Component ${Object.getPrototypeOf(this).name} does not have a property named ${propertyName}.`, true);
        }
        else
        {
            return (<any>this)[propertyName]
        }
    }

    /** @internal */
    setProperty(propertyName: string, value: any)
    {
        if (true) // debug env
        {
            let propValue = (<any>this)[propertyName];
        
            if (propValue && typeof(propValue) !== typeof(value))
            {
                quickWarn(`At component ${Object.getPrototypeOf(this).name}: Received value has different type from previous. (previous: ${typeof(propValue)}, new: ${typeof(value)}).`);
            }
        }

        (<any>this)[propertyName] = value;
    }

    /**
     * Returns a component attached to the same entity or undefined if no component of this class exists.
     */
    getComponent<T extends Component>(componentClass: ComponentClass<T>)
    {
        return this.entity.getComponent(componentClass);
    }

    /**
     * Same as
     * ```typescript
     * this.entity.addComponent<T extends Component>(componentClass: ComponentClass<T>)
     * ```
     */
    addComponent<T extends Component>(componentClass: ComponentClass<T>)
    {
        return this.entity.addComponent(componentClass);
    }

    hasComponent<T extends Component>(componentClass: ComponentClass<T>)
    {
        return this.entity.hasComponent(componentClass);
    }

    destroy(component: Component): void;
    destroy(entity: Entity): void;
    destroy(obj: any)
    {
        this.ecs.destroy(obj);
    }
}
