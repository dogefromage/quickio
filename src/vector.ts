

export class Vector2
{
    public x: number;
    public y: number;

    get xx()
    {
        return [ this.x, this.x ];
    }

    get xy()
    {
        return [ this.x, this.y ];
    }

    set xy([ x, y ])
    {
        this.x = x;
        this.y = y;
    }

    get yy()
    {
        return [ this.y, this.y ];
    }

    get yx()
    {
        return [ this.y, this.y ];
    }

    get xxx()
    {
        return [ this.x, this.x, this.x ];
    }

    get yyy()
    {
        return [ this.y, this.y, this.y ];
    }

    constructor();
    constructor([ x, y ]: number[]);
    constructor(x: number, y: number);

    constructor(...args: any[])
    {
        if (typeof(args[0]) === 'object')
        {
            args = args[0];
        }

        this.x = args[0] | 0;
        this.y = args[1] | 0;
    }

    copy()
    {
        return new Vector2(this.xy);
    }

    add(rhs: Vector2)
    {
        this.x += rhs.x;
        this.y += rhs.y;
    }

    sub(rhs: Vector2)
    {
        this.x -= rhs.x;
        this.y -= rhs.y;
    }

    mult(rhs: Vector2)
    {
        this.x *= rhs.x;
        this.y *= rhs.y;
    }

    div(rhs: Vector2)
    {
        this.x /= rhs.x;
        this.y /= rhs.y;
    }

    lerp(to: Vector2, t: number, clamp = false)
    {
        if (clamp)
        {
            t = t > 1 ? 1 : (t < 0 ? 0 : t);
        }

        this.x += (to.x - this.x) * t;
        this.y += (to.y - this.y) * t;
    }
    
    static add(lhs: Vector2, rhs: Vector2)
    {
        return new Vector2(lhs.xy).add(rhs);
    }
    
    static sub(lhs: Vector2, rhs: Vector2)
    {
        return new Vector2(lhs.xy).sub(rhs);
    }
    
    static mult(lhs: Vector2, rhs: Vector2)
    {
        return new Vector2(lhs.xy).mult(rhs);
    }
    
    static div(lhs: Vector2, rhs: Vector2)
    {
        return new Vector2(lhs.xy).div(rhs);
    }

    static lerp(from: Vector2, to: Vector2, t: number, clamp = false)
    {
        return new Vector2(from.xy).lerp(to, t, clamp);
    }
    
    static dot(lhs: Vector2, rhs: Vector2)
    {
        return lhs.x * rhs.x + lhs.y * rhs.y;
    }
}

export class Vector3
{
    public x: number;
    public y: number;
    public z: number;

    get xx()
    {
        return [ this.x, this.x ];
    }

    get xy()
    {
        return [ this.x, this.y ];
    }

    get xz()
    {
        return [ this.x, this.z ];
    }

    get yy()
    {
        return [ this.y, this.y ];
    }

    get yz()
    {
        return [ this.y, this.z ];
    }

    get zz()
    {
        return [ this.z, this.z ];
    }

    get xxx()
    {
        return [ this.x, this.x, this.x ];
    }

    get yyy()
    {
        return [ this.y, this.y, this.y ];
    }

    get zzz()
    {
        return [ this.z, this.z, this.z ];
    }

    get xyz()
    {
        return [ this.x, this.y, this.z ];
    }

    constructor();
    constructor([ x, y, z ]: number[]);
    constructor(x: number, y: number, z: number);

    constructor(...args: any[])
    {
        if (typeof(args[0]) === 'object')
        {
            args = args[0];
        }

        this.x = args[0] | 0;
        this.y = args[1] | 0;
        this.z = args[2] | 0;
    }

    copy()
    {
        return new Vector3(this.xyz);
    }

    add(rhs: Vector3)
    {
        this.x += rhs.x;
        this.y += rhs.y;
        this.z += rhs.z;
    }

    sub(rhs: Vector3)
    {
        this.x -= rhs.x;
        this.y -= rhs.y;
        this.z -= rhs.z;
    }

    mult(rhs: Vector3)
    {
        this.x *= rhs.x;
        this.y *= rhs.y;
        this.z *= rhs.z;
    }

    div(rhs: Vector3)
    {
        this.x /= rhs.x;
        this.y /= rhs.y;
        this.z /= rhs.z;
    }

    lerp(to: Vector3, t: number, clamp = false)
    {
        if (clamp)
        {
            t = t > 1 ? 1 : (t < 0 ? 0 : t);
        }

        this.x += (to.x - this.x) * t;
        this.y += (to.y - this.y) * t;
        this.z += (to.z - this.z) * t;
    }
    
    static add(lhs: Vector3, rhs: Vector3)
    {
        return new Vector3(lhs.xyz).add(rhs);
    }
    
    static sub(lhs: Vector3, rhs: Vector3)
    {
        return new Vector3(lhs.xyz).sub(rhs);
    }
    
    static mult(lhs: Vector3, rhs: Vector3)
    {
        return new Vector3(lhs.xyz).mult(rhs);
    }
    
    static div(lhs: Vector3, rhs: Vector3)
    {
        return new Vector3(lhs.xyz).div(rhs);
    }

    static lerp(from: Vector3, to: Vector3, t: number, clamp = false)
    {
        return new Vector3(from.xyz).lerp(to, t, clamp);
    }
    
    static dot(lhs: Vector3, rhs: Vector3)
    {
        return lhs.x * rhs.x + lhs.y * rhs.y + lhs.z * rhs.z;
    }

    static cross(lhs: Vector3, rhs: Vector3)
    {
        return new Vector3(
            lhs.y * rhs.z - lhs.z * rhs.y,
            lhs.z * rhs.x - lhs.x * rhs.z,
            lhs.x * rhs.y - lhs.y * rhs.x
        );
    }
}