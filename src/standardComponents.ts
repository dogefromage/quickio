import { Component } from "./entity";
import { Entity } from "./entity";
import { Game } from "./game";
import { Vector2 } from "./vector";

export class Transform2d extends Component
{
    private _position = new Vector2();
    get position()
    {
        return this._position;
    }
    
    private _rotation = new Vector2();
    get rotation()
    {
        return this._rotation;
    }
    
    private _scale = new Vector2(1, 1);
    get scale()
    {
        return this._scale;
    }

    constructor(
        parent: Entity
    )
    {
        super(parent);
    }
}

export type RenderRule = (ctx: CanvasRenderingContext2D) => void;

export class Renderer2d extends Component
{
    private renderRules: RenderRule[] = [];

    constructor(parent: Entity)
    {
        super(parent);
    }

    update(game: Game, dt: number)
    {
        
    }

    render(ctx: CanvasRenderingContext2D)
    {
        for (let rule of this.renderRules)
        {
            rule(ctx);
        }
    }

    addRenderRule(rule: RenderRule)
    {
        this.renderRules.push(rule);
    }

    removeRenderRule(rule: RenderRule)
    {
        this.renderRules = this.renderRules.filter((r) =>
        {
            return r != rule;
        });
    }

    clearAllRenderRules()
    {
        this.renderRules = [];
    }
}