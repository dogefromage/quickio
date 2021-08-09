import { Game } from "./game";

export class Component
{
    constructor(
        public parent: Entity
        )
    {

    }

    update(game: Game, dt: number)
    {
        
    }

    onDestroy()
    {

    }
}

export class Entity
{
    constructor(private game: Game)
    {
        
    }

    private _components = new Map<typeof Component, Component>();
    get components()
    {
        return this._components;
    }

    getComponent(componentType: typeof Component)
    {
        return this.components.get(componentType);
    }

    addComponent(componentType: typeof Component)
    {
        
        let c = this.components.get(componentType);

        if (c === undefined)
        {
            c = <Component>new componentType(this);
            
            this.game.subscribeComponent(componentType, c);
            
            this.components.set(componentType, c);
        }

        return c;
    }

    removeComponent(componentType: any)
    {
        let c = this.components.get(componentType);

        if (c === undefined)
        {
            return;
        }

        c.onDestroy();

        this.game.unsubscribeComponent(componentType, c);
        return this.components.delete(componentType);
    }

    removeAllComponents()
    {
        for (let [ cType, c ] of this.components)
        {
            this.removeComponent(cType);
        }
    }
}
