import { Game } from "./game";

export class Component
{
    constructor(
        public game: Game,
        public entity: Entity
        )
    {

    }

    start()
    {
        
    }

    update()
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

    private components = new Map<typeof Component, Component>();

    getComponent<T extends Component>(componentType: new (game: Game, entity: Entity) => T)
    {
        return <T>this.components.get(componentType);
    }

    addComponent<T extends Component>(componentType: new (game: Game, entity: Entity) => T)
    {
        let c = this.components.get(componentType);

        if (c === undefined)
        {
            c = new componentType(this.game, this);
            c.start();
            
            this.game.subscribeComponent(componentType, c);
            
            this.components.set(componentType, c);
        }

        return <T>c;
    }

    removeComponent<T extends Component>(componentType: new (game: Game, entity: Entity) => T)
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
