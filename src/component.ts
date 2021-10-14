import { timeStamp } from 'console';
import { ECS } from './ecs';
import { Entity } from './entity';
import { quickError } from './utils';

const DEFAULT_STATE_BUFFER_SIZE = 2;

// class StateBuffer
// {
//     constructor()
//     {
        
//     }
// }

type SerializableType = string | number | ComponentState;

type ComponentState = SerializableType[];

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

    // /** @internal */
    // private stateBuffer: StateBuffer;

    public isDestroyed = false;

    constructor(
        public ecs: ECS,
        public entity: Entity
        )
    { 
        // this.stateBuffer = new StateBuffer();
    }

    getId()
    {
        return (<any>this.constructor).id;
    }

    awake() {}

    start() {}

    update() {}

    render() {}

    onDestroy() {}

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
     * 
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

    // /** @internal */
    // addStateToBuffer()
    // {
        
    // }

    /**
     * Returns an attached component and creates if non existent.
     * If you would like to only get a component if it is attached, use getComponentConditional().
     * @param componentType - Component class, which will be returned
     * @returns component - instance of componentType which is attached to this entity.
     */
    getComponent<T extends Component>(componentType: ComponentClass<T>)
    {
        return this.entity.getComponent(componentType);
    }

    addComponent<T extends Component>(componentType: ComponentClass<T>)
    {
        return this.entity.addComponent(componentType);
    }

    hasComponent<T extends Component>(componentType: ComponentClass<T>)
    {
        return this.entity.hasComponent(componentType);
    }

    destroy(component: Component): void;
    destroy(entity: Entity): void;
    destroy(obj: any)
    {
        this.ecs.destroy(obj);
    }
}