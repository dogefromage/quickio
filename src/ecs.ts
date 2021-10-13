import Component, { ComponentClass } from './component';
import Entity from './entity';
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
    ComponentClass | [ classConstructor: ComponentClass, options: ComponentOptions ]

export abstract class ECS
{
    private entities = new Map<string, Entity>();
    private components: ComponentRow[] = [];
    private defaultComponents: ComponentClass<Component>[] = [];

    constructor(componentList: ComponentArrayItem[])
    {
        if (componentList.length === 0)
        {
            quickWarn(`This system was instantiated without any components. Add components as an array in the constructor function.`)
        }
        for (const componentItem of componentList)
        {
            let componentClass = <ComponentClass>componentItem;
            let options = {};

            if (Array.isArray(componentItem))
            {
                componentClass = componentItem[0];
                options = componentItem[1] || {};
            }

            const {
                isDefault
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
    // }return row;

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
        const find = this.components.find(row =>
        {
            return row.componentClass === componentClass;
        });

        return find;
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
    
    createEntity()
    {
        // VERY VERY TEMPORARY 
        let randomId = (Math.floor(Math.random() * 1000000000000000)).toString(16).slice(0, 6);

        let entity = new Entity(this, randomId);

        for (let i = 0; i < this.defaultComponents.length; i++)
        {
            entity.addComponent(this.defaultComponents[i]);
        }
        this.entities.set(randomId, entity);

        return entity;
    }

    removeEntity(entity: Entity)
    {
        if (entity !== undefined)
        {
            this.entities.delete(entity);
            entity.removeAllComponents();
        }
    }

    update()
    {
        // start
        for (let i = 0; i < this.componentList.length; i++)
        {
            // let componentType = this.componentList[i];
            let componentSet = this.componentSets[i];

            for (let component of componentSet)
            {
                if (!component.hasRunStart)
                {
                    component.start();
                    component.hasRunStart = true;
                }
            }
        }

        // update
        for (let i = 0; i < this.componentList.length; i++)
        {
            // let componentType = this.componentList[i];
            let componentSet = this.componentSets[i];

            for (let component of componentSet)
            {
                component.update();
            }
        }
    }
}
