import { Component, ComponentClass, ComponentMethodParams } from '../component';
import { Entity } from '../entity';
import { InputChannel } from '../inputChannel';
import { getUTCSeconds, quickError, quickWarn } from '../utils';
import { ComponentArrayItem, ComponentOptions, ComponentRow, LocalArgs } from './ecsTypes';
import { Time } from '../time';

export abstract class ECS
{
    static defaultInputChannelName = '__default__';

    protected entities = new Map<string, Entity>();
    protected components: ComponentRow[] = [];
    protected defaultComponents: ComponentClass<Component>[] = [];

    /** @internal */
    private inputChannels = new Map<string, InputChannel>();
    private defaultInputChannel: InputChannel;

    protected _time = new Time();

    /** @internal */
    defaultComponentProperties;

    constructor(
        componentList: ComponentArrayItem[], 
        public localArgs: LocalArgs,
    )
    {
        if (componentList.length === 0)
        {
            quickWarn(`This system was instantiated without any components. Add components as an array in the constructor function.`)
        }
        for (const componentItem of componentList)
        {
            let componentClass = <ComponentClass>componentItem;
            let options: ComponentOptions = {};

            if (Array.isArray(componentItem))
            {
                componentClass = componentItem[0];
                options = componentItem[1] || options;
            }

            const {
                isDefault = false
            } = options;

            if (!(componentClass.prototype instanceof Component))
            {
                quickError(`Component ${componentClass.name} is not a valid quick component. The component must extend from the quick.Component class.`, true);
            }

            this.components.push({
                componentClass,
                instances: new Set(),
                options,
            });
            
            if (isDefault)
            {
                this.defaultComponents.push(componentClass);
            }
        }
        
        this.defaultInputChannel = this.createInputChannel(ECS.defaultInputChannelName);

        // detect default component properties
        let testEntity = new Entity(this, '');
        let testComponent = new Component(this, testEntity);
        this.defaultComponentProperties = Object.keys(testComponent);
    }

    /** @internal */
    getComponentMethodParams()
    {
        const methodParams: ComponentMethodParams = 
        {
            time: this._time,
            localArgs: this.localArgs
        };

        return methodParams;
    }

    /** @internal */
    getRowIndexFromType(componentClass: ComponentClass)
    {
        const index = this.components.findIndex(row =>
        {
            return row.componentClass === componentClass;
        });
        return index;
    }

    /** @internal */
    getRowFromType(componentClass: ComponentClass)
    {
        const row = this.components.find(row =>
        {
            return row.componentClass === componentClass;
        });
        return row;
    }

    /** @internal */
    subscribeComponent(componentClass: ComponentClass, component: Component)
    {
        let row = this.getRowFromType(componentClass);

        if (row == null)
            return console.error(`Component ${componentClass.name} has never been initialized. Add your custom component to the list in the constructor of your system.`, true);

        row.instances.add(component);
    }

    /** @internal */
    unsubscribeComponent(componentClass: ComponentClass, component: Component)
    {
        let row = this.getRowFromType(componentClass);

        if (row == null)
            return console.error(`Component ${componentClass.name} has never been initialized. Add your custom component to the list in the constructor of your system.`, true);

        return row.instances.delete(component);
    }

    getAllComponentsOfType<T extends Component>(componentClass: ComponentClass<T>)
    {
        let row = this.getRowFromType(componentClass);
        if (row == null)
        {
            console.error(`Component ${componentClass.name} has never been initialized. Add your custom component to the list in the constructor of your system.`, true);
            return;
        }

        return [ ...(<Set<T>>row.instances) ];
    }

    createEntity(id?: string)
    {
        if (id == null)
        {
            id = (Math.floor(Math.random() * 1000000000000000)).toString(16).slice(0, 6);
        }

        let entity = new Entity(this, id);

        for (let i = 0; i < this.defaultComponents.length; i++)
        {
            entity.addComponent(this.defaultComponents[i]);
        }
        this.entities.set(id, entity);

        return entity;
    }

    getEntityById(id: string)
    {
        return this.entities.get(id);
    }

    destroyEntityById(id: string)
    {
        let entity = this.entities.get(id);
        if (entity == null) return false;

        this.destroy(entity);
        return true;
    }

    destroy(component: Component): void;
    destroy(entity: Entity): void;
    destroy(obj: any)
    {
        if (obj instanceof Component)
        {
            obj.onDestroy(this.getComponentMethodParams());
            obj.isDestroyed = true;

            let constructorFunction = Object.getPrototypeOf(obj).constructor;
            this.unsubscribeComponent(constructorFunction, obj);
            
            return;
        }

        if (obj instanceof Entity)
        {
            for (const comp of obj.components)
            {
                this.destroy(comp);
            }
            obj.components = [];
            obj.isDestroyed = true;
            this.entities.delete(obj.id);

            return;
        }
    }

    createInputChannel(id: string)
    {
        if (this.defaultInputChannel && id === ECS.defaultInputChannelName)
        {
            return this.defaultInputChannel;
        }

        let channel = new InputChannel(id);

        this.inputChannels.set(id, channel);
        return channel;
    }

    removeInputChannel(id: string)
    {
        if (this.getInputChannel(id) === this.getDefaultInputChannel())
        {
            return quickError('Default input channel cannot be deleted', false);
        }

        return this.inputChannels.delete(id);
    }

    getInputChannel(id: string)
    {
        return this.inputChannels.get(id);
    }

    getDefaultInputChannel()
    {
        return this.defaultInputChannel;
    }

    // update(runStart: boolean, runUpdate: boolean, runInterpolate: boolean, runRender: boolean)
    // {
    //     // time
    //     let currTime = getUTCSeconds();
    //     this._time.total = currTime - this._time.start;
    //     this._time.dt = currTime - this._time.current;
    //     this._time.current = currTime;

    //     if (runStart)
    //     {
    //         for (const componentRow of this.components)
    //         {
    //             for (let component of componentRow.instances)
    //             {
    //                 if (!component.hasRunStart)
    //                 {
    //                     component.start(this.localArgs);
    //                     component.hasRunStart = true;
    //                 }
    //             }
    //         }
    //     }

    //     if (runUpdate)
    //     {
    //         for (const componentRow of this.components)
    //         {
    //             for (let component of componentRow.instances)
    //             {
    //                 component.update(this.localArgs);
    //             }
    //         }
    //     }

    //     if (runInterpolate)
    //     {
    //         for (const componentRow of this.components)
    //         {
    //             for (let component of componentRow.instances)
    //             {
    //                 component.interpolateState(this.localArgs);
    //             }
    //         }
    //     }

    //     if (runRender)
    //     {
    //         for (const componentRow of this.components)
    //         {
    //             for (let component of componentRow.instances)
    //             {
    //                 component.render(this.localArgs);
    //             }
    //         }
    //     }
    // }
}
