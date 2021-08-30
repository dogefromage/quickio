import { Bounds2, Vector2 } from "quickio-math";
import { RigidBody2d } from "./rigidbody";
import { Transform2d } from "../components/transform";
import { Component } from "../entity";
import { clamp } from "../utils";

export interface Projection
{
    minDot: number,
    maxDot: number,
    minVert: Vector2,
    maxVert: Vector2
};

export abstract class Collider2d extends Component
{
    private _staticFriction = 0.6;
    get staticFriction() { return this._staticFriction; }    
    set staticFriction(value: number) { this._staticFriction = clamp(value); }

    private _dynamicFriction = 0.3;
    get dynamicFriction() { return this._dynamicFriction; }    
    set dynamicFriction(value: number) { this._dynamicFriction = clamp(value); }

    private _coefficientOfRestitution = 0.5;
    get coefficientOfRestitution() { return this._coefficientOfRestitution; }    
    set coefficientOfRestitution(value: number) { this._coefficientOfRestitution = clamp(value); }

    protected _transform!: Transform2d;
    get transform()
    {
        return this._transform;
    }
    public _rigidbody?: RigidBody2d;
    get rigidbody()
    {
        return this._rigidbody;
    }

    protected needsRecalculation = true;

    protected _area = 0;
    get area()
    {
        return this._area;
    }

    /** @internal */
    get inverseMass()
    {
        return this._rigidbody?.inverseMass || 0;
    }

    /** @internal */
    get inverseMoi()
    {
        return this._rigidbody?.inverseMomentOfInertia || 0;
    }

    get dynamic()
    {
        return this.rigidbody?.canMove || this.rigidbody?.canRotate || false;
    }

    /** @internal */
    public moiOverMass = 0;

    /** @internal */
    public localCM = Vector2.zero;

    protected _bounds: Bounds2 = new Bounds2(Vector2.zero, Vector2.zero);
    get bounds()
    {
        return this._bounds;
    }

    /** @internal */
    abstract project(axis: Vector2): Projection;

    abstract calculateProperties(): void;

    abstract calculateBounds(): void;

    /** @internal */
    public hasBeenCollisionDetected = false;

    // abstract display(ctx: CanvasRenderingContext2D): void;

    start()
    {
        this._transform = this.entity.getComponent(Transform2d);
        
        // unclean - probiere z fixe
        if (this.entity.hasComponent(RigidBody2d))
        {
            this._rigidbody = this.entity.getComponent(RigidBody2d);

            this._rigidbody.addCollider(this);
        }

        this.calculateBounds();
    }

    earlyUpdate()
    {
        if (this.rigidbody !== undefined)
        {
            if (!this.rigidbody.isAttachedToEntity)
            {
                this._rigidbody = undefined;
            }
            else
            {
                if (this.needsRecalculation)
                {
                    this.calculateProperties();
                    this.needsRecalculation = false;
                }
            }
        }

        this.hasBeenCollisionDetected = false;
    }

    update()
    {
        this.calculateBounds();
    }

    onDestroy()
    {
        this._rigidbody?.removeCollider(this);
    }
}

export class CircleCollider extends Collider2d
{
    private _radius = 0;
    get radius()
    {
        return this._radius;
    }
    set radius(value: number)
    {
        if (value > 0)
        {
            this._radius = value;
            this.needsRecalculation = true;
        }
    }

    calculateProperties()
    {
        this._area = Math.PI * this._radius * this._radius;

        this.moiOverMass = 0.5 * this._radius * this._radius;

        this.localCM.reset();
    }

    calculateBounds()
    {
        let xy = this.transform.position.xy
        this._bounds.min.xy = xy;
        this._bounds.max.xy = xy;
        this._bounds.min.x -= this._radius;
        this._bounds.min.y -= this._radius;
        this._bounds.max.x += this._radius;
        this._bounds.max.y += this._radius;
    }

    project(axis: Vector2)
    {
        let dotCenter = Vector2.dot(this.transform.position, axis);

        let minDot = dotCenter - this._radius;
        let maxDot = dotCenter + this._radius

        let proj: Projection = 
        {
            minDot, maxDot,
            minVert: axis.copy().scale(minDot),
            maxVert: axis.copy().scale(maxDot),
        };

        return proj;
    }

    display(ctx: CanvasRenderingContext2D)
    {
        this.game.debug.drawCircle(this.transform.position, this.radius);
    }
}

export const ColliderList = [ CircleCollider ];