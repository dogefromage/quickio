import { Bounds2, Vector2 } from "quickio-math";
import { hexColorToStringColor } from "./utils";

interface Circle
{
    position: Vector2,
    radius: number
};

interface DebugJob
{
    shape: Circle | Vector2[],
    expirationTime: number,
    color: number,
    lineWidth: number,
}

function getTime()
{
    return new Date().getTime();
}

export class Debug
{
    private jobs: DebugJob[] = [];

    constructor()
    {

    }

    drawPoint(point: Vector2, { time = 0, color = 0xff00ff, lineWidth = 1 } = {})
    {
        let expirationTime = getTime() + time * 1000;

        this.jobs.push( { shape: [ point ], expirationTime, color, lineWidth } );
    }

    drawRect(rect: Bounds2, { time = 0, color = 0xff00ff, lineWidth = 1 } = {})
    {
        let expirationTime = getTime() + time * 1000;

        this.jobs.push(
        {
            shape: 
            [
                new Vector2(rect.min.x, rect.min.y),
                new Vector2(rect.max.x, rect.min.y),
                new Vector2(rect.max.x, rect.max.y),
                new Vector2(rect.min.x, rect.max.y)
            ],
            expirationTime, color, lineWidth
        });
    }

    drawCircle(position: Vector2, radius: number, { time = 0, color = 0xff00ff, lineWidth = 1 } = {})
    {
        let expirationTime = getTime() + time * 1000;

        this.jobs.push(
        {
            shape: { position, radius },
            expirationTime, color, lineWidth
        });
    }

    draw(ctx: CanvasRenderingContext2D)
    {
        let time = getTime();

        for (let i = this.jobs.length - 1; i >= 0; i--)
        {
            ctx.strokeStyle = hexColorToStringColor(this.jobs[i].color);
            let lw = this.jobs[i].lineWidth;
            ctx.lineWidth = lw;

            ctx.beginPath();
            let shape = this.jobs[i].shape;
            if (shape instanceof Array)
            {
                if (shape.length === 1)
                {
                    ctx.ellipse(shape[0].x, shape[0].y, lw, lw, 0, 0, 6.28);
                }
                else
                {
                    for (let j = 0; j < shape.length; j++)
                    {
                        if (j == 0)
                        {
                            ctx.moveTo(shape[j].x, shape[j].y);
                        }
                        else
                        {
                            ctx.lineTo(shape[j].x, shape[j].y);
                        }
                    }
                }

            }
            else
            {
                ctx.ellipse(shape.position.x, shape.position.y, shape.radius, shape.radius, 0, 0, Math.PI * 2);
            }
            
            ctx.closePath();
            
            ctx.stroke();

            if (this.jobs[i].expirationTime < time)
            {
                this.jobs.splice(i, 1);
            }
        }
    }
}