import { Component } from "../entity";
import { Transform2d } from "./transform";

export type RenderRule = (ctx: CanvasRenderingContext2D) => void;

export class Renderer2d extends Component
{
    public zDepth = 0;
    
    private renderRules: RenderRule[] = [];
    public transform!: Transform2d;
    
    start()
    {
        this.transform = this.entity.getComponent(Transform2d);
    }

    update()
    {
        
    }

    render(ctx: CanvasRenderingContext2D)
    {
        for (let rule of this.renderRules)
        {
            rule(ctx);
        }
    }

    addRenderStep(rule: RenderRule)
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
