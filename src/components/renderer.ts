import { Component, Entity } from "../entity";
import { Game } from "../game";

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
