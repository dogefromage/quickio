import { Component, ComponentClass } from '../component';
import { Entity } from '../entity';
import { InputChannel } from '../inputChannel';
import { getUTCSeconds, quickError, quickWarn } from '../utils';
import { ComponentArrayItem, ComponentOptions, ComponentRow, LocalArgs, Time } from './ecsTypes';

export abstract class ECS
{
    protected entities = new Map<string, Entity>();
    protected components: ComponentRow[] = [];
    protected defaultComponents: ComponentClass<Component>[] = [];

    /** @internal */
    private inputChannels = new Map<string, InputChannel>();
    private defaultInputChannel;

    private _time;
    get deltaTime() { return this._time.dt; }
    get currentTime() { return this._time.current; }
    get starTime() { return this._time.start; }
    get totalTime() { return this._time.total; }

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
        
        let currentTime = getUTCSeconds();
        this._time = {
            dt: 0.1,
            total: 0,
            current: currentTime,
            start: currentTime,
        } as Time;

        this.defaultInputChannel = this.createInputChannel('default');
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
            obj.onDestroy(this.localArgs);
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

    /** @internal */
    createInputChannel(id: string)
    {
        let channel = new InputChannel(id);
        this.inputChannels.set(id, channel);
        return channel;
    }

    /** @internal */
    removeInputChannel(id: string)
    {
        return this.inputChannels.delete(id);
    }

    /** @internal */
    getInputChannel(id: string)
    {
        return this.inputChannels.get(id);
    }

    getDefaultInputChannel()
    {
        return this.defaultInputChannel;
    }

    update(runStart: boolean, runUpdate: boolean, runRender: boolean)
    {
        // time
        let currTime = getUTCSeconds();
        this._time.total = currTime - this._time.start;
        this._time.dt = currTime - this._time.current;
        this._time.current = currTime;

        if (runStart)
        {
            for (const componentRow of this.components)
            {
                for (let component of componentRow.instances)
                {
                    if (!component.hasRunStart)
                    {
                        component.start(this.localArgs);
                        component.hasRunStart = true;
                    }
                }
            }
        }

        if (runUpdate)
        {
            for (const componentRow of this.components)
            {
                for (let component of componentRow.instances)
                {
                    component.update(this.localArgs);
                }
            }
        }

        if (runRender)
        {
            for (const componentRow of this.components)
            {
                for (let component of componentRow.instances)
                {
                    component.render(this.localArgs);
                }
            }
        }


    }
}
