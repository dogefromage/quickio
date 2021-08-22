import { Vector2 } from "quickio-math";


export class CustomShape2d
{
    constructor(public vertices: Vector2[]) { }
}

class Circle
{
    constructor(public radius: number) {};
}

class Square
{
    public vertices: Vector2[];

    constructor(sideLength: number) 
    {
        let s = 0.5 * sideLength;
        this.vertices = [
            new Vector2(-s, -s),
            new Vector2( s, -s),
            new Vector2( s,  s),
            new Vector2(-s,  s),
        ];
    }
}

class Rectangle
{
    public vertices: Vector2[];

    constructor(public width: number, public height: number) 
    {
        let w = 0.5 * width;
        let h = 0.5 * height;
        this.vertices = [
            new Vector2(-w, -h),
            new Vector2( w, -h),
            new Vector2(-w,  h),
            new Vector2( w,  h),
        ];
    }
}

class NGon
{
    public vertices: Vector2[] = [];

    constructor(n: number, outerRadius: number)
    {
        if (n < 3)
        {
            return;
        }

        let angle = 6.28318530717958 / n;
        for (let i = 0; i < n; i++)
        {
            this.vertices.push(new Vector2(
                Math.cos(i * angle) * outerRadius,
                Math.sin(i * angle) * outerRadius,
            ));
        }
    }
}

export type Shape2d = CustomShape2d | Circle | Square | Rectangle | NGon;

export const PrimitiveShapes = 
{
    Circle,
    Square,
    Rectangle,
    NGon,
}