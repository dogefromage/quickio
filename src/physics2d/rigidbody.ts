import { Transform2d } from "../components/transform";
import { Component } from "../entity";
import { Vector2 } from "quickio-math";
import { clamp } from "../utils";
import { Collider2d } from "./collider";

export class RigidBody2d extends Component
{
    private needsRecalculation = true;

    private _density = 1;

    private _mass = 1;
    private customMass = false;
    get mass()
    {
        return this._mass;
    }
    set mass(value: number)
    {
        if (value > 0)
        {
            this._mass = value;
            this.customMass = true;
            this.needsRecalculation = true;
        }
        else
        {
            console.error('The mass of an object must be greater than zero!');
        }
    }
    resetMass()
    {
        this.customMass = false;
        this.needsRecalculation = true;
    }
    /** @internal */
    get inverseMass()
    {
        return this.canMove ? 1 / this._mass : 0;
    }

    private moi = 1;
    private customMoi = false
    get momentOfInertia()
    {
        return this.moi;
    }
    set momentOfInertia(value: number)
    {
        if (value > 0)
        {
            this.moi = value;
            this.customMoi = true;
            this.needsRecalculation = true;
        }
        else
        {
            console.error('The moment of inertia of an object must be greater than zero!');
        }
    }
    /** @internal */
    get inverseMomentOfInertia()
    {
        return this.canRotate ? 1 / this.moi : 0;
    }

    private _localCM = Vector2.zero; // calculated in calculateMassProperties()
    private _globalCM = Vector2.zero; // transformed in updateCM()
    private customCM = false;
    /**
     * Returns the center of mass in global coordinates
     * @returns Center of mass in global coordinates
     */
    get centerOfMass()
    {
        return this._globalCM;
    }
    setCenterOfMass(localPosition: Vector2)
    {
        this._localCM.xy = localPosition.xy;
        this.customCM = true;
        this.needsRecalculation = true;
    }
    resetCenterOfMass()
    {
        this.customCM = false;
        this.needsRecalculation = true;
    }
    
    public canMove = true;
    public canRotate = true;

    public useGravity = true;

    private sumOfForces = Vector2.zero;
    private sumOfTorques = 0;

    private _velocity: Vector2 = new Vector2();
    get velocity()
    {
        return this._velocity;
    }

    public angularVelocity: number = 0;

    public transform!: Transform2d;

    private colliders = new Set<Collider2d>();

    addCollider(collider: Collider2d)
    {
        this.colliders.add(collider);
        this.needsRecalculation = true;
    }

    removeCollider(collider: Collider2d)
    {
        this.colliders.delete(collider);
        this.needsRecalculation = true;
    }

    accelerate(acceleration: Vector2)
    {
        this.sumOfForces.add(acceleration.copy().scale(this._mass));
    }

    addForce(force: Vector2)
    {
        this.sumOfForces.add(force);
    }

    applyImpulseAtPosition(impulse: Vector2, globalPosition: Vector2)
    {
        if (this.canMove)
        {
            this.velocity.add(impulse.copy().scale(this.inverseMass));
        }
        
        if (this.canRotate)
        {
            let r = globalPosition.copy().subtract(this.centerOfMass);
            this.angularVelocity += Vector2.cross(r, impulse).z * this.inverseMomentOfInertia;
        }
    }

    getVelocityAtPosition(globalPosition: Vector2)
    {
        // v = r x omega
        let r = globalPosition.copy().subtract(this.centerOfMass);
        let tangentialV = new Vector2(-r.y, r.x).scale(this.angularVelocity);
        return this.velocity.copy().add(tangentialV);
    }

    setMassByColliderArea(density = 1)
    {
        if (density > 0)
        {
            this._density = density;
            this.customMass = false;
            this.needsRecalculation = true;
        }
        else
        {
            console.error(`Density must be greater than zero! '${density}' was provided`);
        }
    }

    start()
    {
        this.transform = this.entity.getComponent(Transform2d);
    }

    /** @internal */
    earlyUpdate()
    {
        if (this.needsRecalculation)
        {
            this.needsRecalculation = false;
            
            let hasColliders = this.colliders.size > 0;

            // mass
            if (!this.customMass)
            {
                if (hasColliders)
                {
                    this._mass = 0;
                    for (let collider of this.colliders)
                    {
                        this._mass += collider.area;
                    }
                    this._mass *= this._density;
                }

                this._mass = this._density;
            }

            // center of gravity
            if (!this.customCM)
            {
                this._localCM.reset();

                let totalArea = 0;
                
                for (let collider of this.colliders)
                {
                    this._localCM.add(collider.localCM.copy().scale(collider.area));
                    totalArea = collider.area;
                }
    
                if (totalArea > 0)
                {
                    this._localCM.scale( 1 / totalArea );
                }
                else
                {
                    this._localCM.reset();
                }
            }
            
            // moment of inertia
            if (!this.customMoi)
            {
                if (hasColliders)
                {
                    let moiOverMass = 0;
                    
                    // parallel axis theorem
                    for (let collider of this.colliders)
                    {
                        moiOverMass += collider.moiOverMass;
                        moiOverMass += collider.localCM.copy().subtract(this._localCM).squaredLength();
                    }

                    this.moi = moiOverMass * this.mass;
                }
                else
                {
                    this.moi = 1;
                }
            }
        }
    }

    update()
    {
        this._globalCM = this.transform.transformPoint(this._localCM);

        let dt = this.game.deltaTime;

        if (this.useGravity)
        {
            this.accelerate(this.game.constants.g);
        }

        // movement
        if (this.canMove)
        {
            this.velocity.add(this.sumOfForces.scale(dt / this.mass));
            this.transform.position.add(this.velocity.copy().scale(dt));
        }
        else
        {
            this.velocity.reset();
        }
        this.sumOfForces.reset();
        
        // rotation
        if (this.canRotate)
        {
            this.angularVelocity += this.sumOfTorques * dt / this.momentOfInertia;
            this.transform.rotation += this.angularVelocity * dt;
        }
        else
        {
            this.angularVelocity = 0;
        }
        this.sumOfTorques = 0;
    }
}