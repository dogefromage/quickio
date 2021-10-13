import { ECS } from './ecs';
import Entity from './entity';
import { quickError } from './utils';

const DEFAULT_STATE_BUFFER_SIZE = 2;

class StateBuffer
{
    constructor()
    {
        
    }
}

type SerializableType = string | number;

function isSerializable(value: SerializableType)
{
    return typeof(value) === 'number' || typeof(value) === 'string';
}

type SyncProperty = string | ( () => SerializableType[] );

const PLACEHOLDER: SerializableType[] = [];

function serialize(value: any): SerializableType[]
{
    if (value == null)
    {
        quickError(`Value: ${value} is not serializable`);
        return PLACEHOLDER;
    }

    if (isSerializable(value))
    {
        return [ value ];
    }

    if (typeof(value) === 'function')
    {
        return serialize(value());
    }

    if (Array.isArray(value))
    {
        let arr: SerializableType[] = [];
        for (const val of value)
        {
            arr = arr.concat(serialize(val));
        }
    }

    if (typeof(value) === 'object')
    {
        quickError(`Value: ${value} is not serializable`);
        return PLACEHOLDER;
    }
    
    quickError(`Value: ${value} is not serializable or was not recognized.`);
    return PLACEHOLDER;
}

export type ComponentClass<T extends Component = Component> = 
    new (ecs: ECS, entity: Entity) => T;

export default class Component
{
    private _isAttachedToEntity = true;
    /**
     * This property will get set to false after the component has been removed from its entity. If your component is referenced somewhere else, it may be useful to check if the component is still attached.
     */
    get isAttachedToEntity()
    {
        return this._isAttachedToEntity;
    }

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

    syncState(syncProperty: SyncProperty)
    {
        if (this.hasRunStart)
        {
            quickError(`syncState() can only be called before or during the start() method. This ensures that all variables stay in sync`);
            return;
        }

        this.syncProperties.push(syncProperty);
    }

    /**
     * This method is used internally to pack all sync-properties into an array in the order in which they where assigned. This method can be overwritten or the output can be modified using super.getState().
     * 
     * @returns Array of serialized sync vars
     */
    getState()
    {
        let state: SerializableType[] = [];

        for (const prop of this.syncProperties)
        {
            let value: any;

            if (typeof(prop) === 'string')
            {
                value = (<any>this)[prop];
            }

            if (typeof(prop) === 'function')
            {
                value = prop();
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

    setState(stateArray: SerializableType[])
    {
        let state: SerializableType[] = [];

        for (const prop of this.syncProperties)
        {
            let value: any;

            if (typeof(prop) === 'string')
            {
                value = (<any>this)[prop];
            }

            if (typeof(prop) === 'function')
            {
                value = prop();
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