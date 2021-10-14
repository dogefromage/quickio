import { Component, ComponentClass } from './component';
import { Entity } from './entity';
import { quickError, quickWarn } from './utils';

type ComponentRow = 
{
    componentClass: ComponentClass;
    instances: Set<Component>;
    options: {}    
}

type ComponentOptions = {
    isDefault?: boolean;
}

type ComponentArrayItem =
    ComponentClass | [ classConstructor: ComponentClass, options: ComponentOptions ];

export abstract class ECS
{
    protected entities = new Map<string, Entity>();
    protected components: ComponentRow[] = [];
    protected defaultComponents: ComponentClass<Component>[] = [];

    constructor(componentList: ComponentArrayItem[])
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
                return;
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
    }

    // createInputChannel()
    // {
    //     return this.inputManager.createChannel();
    // }

    // deleteInputChannel(channel: InputChannel)
    // {
    //     this.inputManager.deleteChannel(channel);
    // }

    // setDefaultComponents(defaultComponentList: (typeof Component)[])
    // {
    //     this.defaultComponents = defaultComponentList;
    // }

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
            obj.onDestroy();
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
}

export class SinglePlayerECS extends ECS
{
    update()
    {
        // start
        for (const componentRow of this.components)
        {
            for (let component of componentRow.instances)
            {
                if (!component.hasRunStart)
                {
                    component.start();
                    component.hasRunStart = true;
                }
            }
        }

        // update
        for (const componentRow of this.components)
        {
            for (let component of componentRow.instances)
            {
                component.update();
            }
        }

        // render
        for (const componentRow of this.components)
        {
            for (let component of componentRow.instances)
            {
                component.render();
            }
        }
    }
}