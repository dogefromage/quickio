import { Component } from "../entity";
import { Shape2d, PrimitiveShapes } from "../shapes";
import { hexColorToStringColor } from "../utils";
import { Transform2d } from "./transform";

export class RenderStyle2d
{
    private _fillColor = 0;
    private _fill = true;
    fill(hexNumber: number)
    {
        this._fillColor = hexNumber;
        this._fill = true;
        return this;
    }
    noFill()
    {
        this._fill = false;
        return this;
    }
    
    private _strokeColor = 0;
    private _stroke = true;
    stroke(hexNumber: number)
    {
        this._strokeColor = hexNumber;
        this._stroke = true;
        return this;
    }
    noStroke()
    {
        this._stroke = false;
        return this;
    }

    private _lineWidth = 1;
    lineWidth(width: number)
    {
        this._lineWidth = width;
        return this;
    }

    loadStyle(ctx: CanvasRenderingContext2D)
    {
        if (this._fill)
        {
            ctx.fillStyle = hexColorToStringColor(this._fillColor);
        }
        
        if (this._stroke)
        {
            ctx.strokeStyle = hexColorToStringColor(this._strokeColor);
            ctx.lineWidth = this._lineWidth;
        }
    }
    
    applyStyle(ctx: CanvasRenderingContext2D)
    {
        if (this._fill)
        {
            ctx.fill();
        }
        if (this._stroke)
        {
            ctx.stroke();
        }
    }
}

type CustomRenderFunction = (ctx: CanvasRenderingContext2D) => void;
type RenderShapeAndMaterial = [ Shape2d, RenderStyle2d ];

export class Renderer2d extends Component
{
    public zDepth = 0;
    
    private renderSteps: (CustomRenderFunction | RenderShapeAndMaterial)[] = [];
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
        for (let step of this.renderSteps)
        {
            if (typeof(step) === 'function')
            {
                step(ctx);
            }
            else
            {
                let [ shape, style ] = step;

                style.loadStyle(ctx);
                
                ctx.beginPath();

                if (shape instanceof PrimitiveShapes.Circle)
                {
                    ctx.ellipse(
                        this.transform.position.x, 
                        this.transform.position.y,
                        this.transform.scale.x * shape.radius, 
                        this.transform.scale.y * shape.radius,
                        this.transform.rotation, 0, 6.2831853071);
                    
                }
                else
                {
                    for (let i = 0; i < shape.vertices.length; i++)
                    {
                        let tv = this.transform.transformPoint(shape.vertices[i]);
                        
                        if (i === 0)
                        {
                            ctx.moveTo(tv.x, tv.y);
                        }
                        else
                        {
                            ctx.lineTo(tv.x, tv.y);
                        }
                    }
                    ctx.closePath();
                }
                
                style.applyStyle(ctx);
            }
        }
    }

    addRenderStep(renderFunction: CustomRenderFunction): void;
    addRenderStep(shape: Shape2d, style: RenderStyle2d): void;

    addRenderStep(...args: any[])
    {
        if (typeof(args[0]) === 'function')
        {
            this.renderSteps.push(args[0]);
        }
        else
        {
            this.renderSteps.push([ args[0], args[1] ]);
        }
    }

    clearAllRenderSteps()
    {
        this.renderSteps = [];
    }
}
