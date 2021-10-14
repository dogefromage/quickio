import { ECS } from './ecs';
import Entity from './entity';
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
    return typeof(value) === 'number' || typeof(value) === 'string';
}

export interface CustomSyncProperty
{
    getProps: () => ComponentState,
    setProps: (state: ComponentState) => void,
}

type SyncProperty = string | CustomSyncProperty;

// const PLACEHOLDER: SerializableType[] = [];

// function serialize(value: any): SerializableType[]
// {
//     if (value == null)
//     {
//         quickError(`Value: ${value} is not serializable`);
//         return PLACEHOLDER;
//     }

//     if (isSerializable(value))
//     {
//         return [ value ];
//     }

//     if (typeof(value) === 'function')
//     {
//         return serialize(value());
//     }

//     if (Array.isArray(value))
//     {
//         let arr: SerializableType[] = [];
//         for (const val of value)
//         {
//             arr = arr.concat(serialize(val));
//         }
//     }

//     if (typeof(value) === 'object')
//     {
//         quickError(`Value: ${value} is not serializable`);
//         return PLACEHOLDER;
//     }
    
//     quickError(`Value: ${value} is not serializable or was not recognized.`);
//     return PLACEHOLDER;
// }

export type ComponentClass<T extends Component = Component> = 
    new (ecs: ECS, entity: Entity) => T;

export default class Component
{
    /** @internal */
    hasRunStart = false;

    /** @internal */
    private syncProperties: SyncProperty[] = [];

    /** @internal */
    private stateBuffer: StateBuffer;

    constructor(
        public ecs: ECS,
        public entity: Entity
        )
    { 
        this.stateBuffer = new StateBuffer();
    }

    getId()
    {
        return (<any>this.constructor).id;
    }

    awake() {}

    start() {}

    update() {}

    onDestroy() {}

    /** @internal */
    dispose()
    {
        this.onDestroy();
    }

    syncState(syncProperty: SyncProperty)
    {
        if (this.hasRunStart)
        {
            quickError(`syncState() can only be called before or during the start() method. This ensures that all variables stay in sync`, true);
        }

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

            // IF PROP IS ARRAY 
            if (Array.isArray(value))
            {
                for (let i = 0; i < value.length; i++)
                {
                    if (isSerializable(value[i]))
                    {
                        state.push(value[i]);
                    }
                }
                continue;
            }

            // IF PROP IS NOT ARRAY
            if (isSerializable(value))
            {
                state.push(value);
                continue;
            }

            // OTHERWISE
            quickError(`syncProperty: '${prop}' was not found on object.`);
        }

        return state;
    }

    setState(state: ComponentState) : void
    {
        let pointer = 0;

        for (const prop of this.syncProperties)
        {
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
                
            }

            if (value == null)
            {
                quickError(`syncProperty: '${prop}' was not found on object.`);
                continue;
            }

            if (Array.isArray(value))
            {
                for (let i = 0; i < value.length; i++)
                {
                    if (isSerializable(value[i]))
                    {
                        state.push(value[i]);
                    }
                }
                continue;
            }

            if (isSerializable(value))
            {
                state.push(value);
                continue;
            }

            quickError(`syncProperty: '${prop}' was not found on object.`);
        }

        return state;
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

    /** @internal */
    addStateToBuffer()
    {
        
    }

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

    removeComponent<T extends Component>(componentType: ComponentClass<T>)
    {
        return this.entity.removeComponent(componentType);
    }
}