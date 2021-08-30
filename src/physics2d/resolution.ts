import { Vector2, Vector3 } from "quickio-math";
import { Contact } from "./detection";

const COLLISION_EPSILON = 0.01;
const OVERLAP_CORRECTION = 0.1;

const RESOLVE_FRICTION = true;

function fixOverlap(c: Contact)
{
    let overlapCorrection = OVERLAP_CORRECTION * c.overlap * c.overlap * (c.A.inverseMass + c.B.inverseMass);
    
    if (c.A.dynamic)
    {
        let corr = overlapCorrection * c.A.inverseMass;
        if (corr > c.overlap) corr = c.overlap;
        
        c.A.transform.position.add(c.normal.copy().scale( corr ));
    }
    if (c.B.dynamic)
    {
        let corr = overlapCorrection * c.B.inverseMass;
        if (corr > c.overlap) corr = c.overlap;
        
        c.B.transform.position.add(c.normal.copy().scale( -corr ));
    }
}

export function resolveContact(c: Contact)
{
    let A = c.A;
    let B = c.B;

    if ( !A.dynamic && !B.dynamic )
    {
        return;
    }
    
    let padot = A.rigidbody?.getVelocityAtPosition(c.point) || Vector2.zero;
    let pbdot = B.rigidbody?.getVelocityAtPosition(c.point) || Vector2.zero;
    
    let vrel = Vector2.dot(padot.copy().subtract(pbdot), c.normal);    
        
    if (vrel > COLLISION_EPSILON)
    {
        // objects moving apart
        return;
    }
    else if (vrel > -COLLISION_EPSILON)
    {
        // resting collision
    }
    else
    {
        A.game.debug.drawPoint(c.point);

        // impacting collision

        let cr = Math.sqrt(A.coefficientOfRestitution * B.coefficientOfRestitution);
        
        // calculate j
        let denominator = 0;

        if (A.dynamic)
        {
            denominator += A.inverseMass;
            
            if (A.rigidbody?.canRotate)
            {
                let r = c.point.copy().subtract(A.rigidbody.centerOfMass);
                let crissCross = Vector3.cross(Vector2.cross(r, c.normal).scale(A.inverseMoi), new Vector3(r.x, r.y, 0));
                
                denominator += Vector2.dot(new Vector2(crissCross.x, crissCross.y), c.normal);
            }
        }
        
        if (B.dynamic)
        {
            denominator += B.inverseMass;
            
            if (B.rigidbody?.canRotate)
            {
                let r = c.point.copy().subtract(B.rigidbody.centerOfMass);
                let crissCross = Vector3.cross(Vector2.cross(r, c.normal).scale(B.inverseMoi), new Vector3(r.x, r.y, 0));
                
                denominator += Vector2.dot(new Vector2(crissCross.x, crissCross.y), c.normal);
            }
        }

        if (denominator === 0)
        {
            throw new Error(`Denominator is zero????`);
        }

        let j = -(1 + cr) * vrel / denominator;
        let J = c.normal.copy().scale(j);
        
        if (c.A.dynamic)
        {
            c.A.rigidbody?.applyImpulseAtPosition(J, c.point);
        }
        if (c.B.dynamic)
        {
            c.B.rigidbody?.applyImpulseAtPosition(J.negate(), c.point);
        }
        
        if (RESOLVE_FRICTION)
        {
            // https://gamedevelopment.tutsplus.com/tutorials/how-to-create-a-custom-2d-physics-engine-friction-scene-and-jump-table--gamedev-7756
            
            padot = A.rigidbody?.getVelocityAtPosition(c.point) || Vector2.zero;
            pbdot = B.rigidbody?.getVelocityAtPosition(c.point) || Vector2.zero;
        
            // Solve for the tangent vector
            
            let rv = padot.copy().subtract(pbdot);
            let tang = new Vector2(-c.normal.y, c.normal.x);
            if (Vector2.dot(tang, rv) < 0)
            {
                tang.negate();
            }
    
            denominator = 0;
    
            if (A.dynamic)
            {
                denominator += A.inverseMass;
                
                if (A.rigidbody?.canRotate)
                {
                    let r = c.point.copy().subtract(A.rigidbody.centerOfMass);
                    let crissCross = Vector3.cross(Vector2.cross(r, tang).scale(A.inverseMoi), new Vector3(r.x, r.y, 0));
                    
                    denominator += Vector2.dot(new Vector2(crissCross.x, crissCross.y), tang);
                }
            }
    
            if (B.dynamic)
            {
                denominator += B.inverseMass;
                
                if (B.rigidbody?.canRotate)
                {
                    let r = c.point.copy().subtract(B.rigidbody.centerOfMass);
                    let crissCross = Vector3.cross(Vector2.cross(r, tang).scale(B.inverseMoi), new Vector3(r.x, r.y, 0));
                    
                    denominator += Vector2.dot(new Vector2(crissCross.x, crissCross.y), tang);
                }
            }
    
            let jt = -(1 + cr) * Vector2.dot(rv, tang) / denominator;
    
            const combinedStaticFriction = Math.sqrt(A.staticFriction * B.staticFriction);
            const combinedDynamicFriction = Math.sqrt(A.dynamicFriction * B.dynamicFriction);
    
            let frictionImpulse;
            if (Math.abs(jt) < j * combinedStaticFriction)
            {
                frictionImpulse = tang.copy().scale(jt);
            }
            else
            {
                frictionImpulse = tang.copy().scale(-j * combinedDynamicFriction);
            }
    
            if (c.A.dynamic)
            {
                c.A.rigidbody?.applyImpulseAtPosition(frictionImpulse, c.point);
            }
            if (c.B.dynamic)
            {
                c.B.rigidbody?.applyImpulseAtPosition(frictionImpulse.negate(), c.point);
            }
        }
    }

    fixOverlap(c);
}