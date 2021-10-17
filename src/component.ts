import { ECS } from './systems/ecs';
import { Entity } from './entity';
import { InputChannel } from './inputChannel';
import { quickError, quickWarn } from './utils';
import { LocalArgs, Time } from './systems/ecsTypes';

const DEFAULT_STATE_BUFFER_SIZE = 2;

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

export type ComponentClass<T extends Component = Component> = 
    new (ecs: ECS, entity: Entity) => T;

export class Component
{
    /** @internal */
    hasRunStart = false;

    /** @internal */
    syncProperties: SyncProperty[] = [];

    public isDestroyed;

    public input: InputChannel;

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

    awake(localArgs: LocalArgs) {}

    start(localArgs: LocalArgs) {}

    update(localArgs: LocalArgs) {}

    render(localArgs: LocalArgs) {}

    onDestroy(localArgs: LocalArgs) {}

    setInputChannel(channelId: string)
    {
        let channel = this.ecs.getInputChannel(channelId);
        if (channel == null)
        {
            quickWarn(`Input channel "${channelId}" did not exist. Current input channel used.`);
            return;
        }
        this.input = channel;
    }

    sync(...syncProperties: SyncProperty[])
    {
        if (this.hasRunStart)
        {
            quickError(`${this.sync.name}() can only be called before or during the start() method. This ensures that all variables stay in sync`, true);
        }

        for (const syncProperty of syncProperties)
        {
            if (typeof(syncProperty) === 'string')
            {
                this.syncProperties.push(syncProperty);
            }
    
            if (typeof(syncProperty as CustomSyncProperty) === 'object')
            {
                if (!syncProperty.hasOwnProperty('getProps') ||
                    !syncProperty.hasOwnProperty('setProps'))
                {
                    quickError("Objects as properties are only possible as CustomSyncProperties, which must include a getProps() and setProps function.", true);
                }
            }
        }
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
            
            if (propValue == null)
            {
                quickError(`Component ${Object.getPrototypeOf(this).name} does not have a property named ${propertyName}.`, true);
            }
            
            if (typeof(propValue) !== typeof(value))
            {
                quickError(`At component ${Object.getPrototypeOf(this).name}: Property type cannot be different from its initial state (initial type: ${typeof(propValue)}, passed value type: ${typeof(value)}).`, true);
            }
        }

        (<any>this)[propertyName] = value;
    }

    /**
     * Returns a component attached to the same entity or undefined if no component of this class exists.
     * @param componentClass - Class of component.
     * @returns component - component attached to the same entity.
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