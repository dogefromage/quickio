import { ECS } from './systems/ecs';
import { Entity } from './entity';
import { InputChannel } from './inputChannel';
import { quickError, quickWarn } from './utils';
import { LocalArgs } from './systems/ecsTypes';
import { calculateStateGradient, integrateState } from './componentState';
import { Time } from './time';

export interface ComponentMethodParams
{
    time: Time;
    localArgs?: LocalArgs;
}

type SerializableType = string | number | ComponentState;

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

export interface CustomSyncProperty
{
    getProps: () => ComponentState,
    setProps: (state: ComponentState) => void,
}

type SyncProperty = string | CustomSyncProperty;

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

export type ComponentClass<T extends Component = Component> = 
    new (ecs: ECS, entity: Entity) => T;

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

    init(componentMethodParams: ComponentMethodParams) {}

    start(componentMethodParams: ComponentMethodParams) {}

    update(componentMethodParams: ComponentMethodParams) {}

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
