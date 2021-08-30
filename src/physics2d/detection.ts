import { Vector2 } from "quickio-math";
import { Collider2d, CircleCollider, ColliderList } from "./collider";

export interface Contact
{
    A: Collider2d,
    B: Collider2d,
    normal: Vector2,
    point: Vector2,
    overlap: number,
};

function circle_circle(c_one: Collider2d, c_two: Collider2d)
{
    let A = <CircleCollider>c_one;
    let B = <CircleCollider>c_two;

    let posDif = A.transform.position.copy().subtract(B.transform.position);
    let sqrDist = posDif.squaredLength()
    let sumRad = A.radius + B.radius;

    if (sqrDist === 0)
    {
        return;
    }

    if (sqrDist < sumRad * sumRad)
    {
        let dist = Math.sqrt(sqrDist);

        let normal = posDif.copy().scale( 1 / dist );
        
        // point in center of collision lens
        let point = posDif.scale(B.radius / sumRad).add(B.transform.position);

        let contact: Contact = 
        { 
            A, B, 
            normal, 
            point, 
            overlap: sumRad - dist
        }
        
        return contact;
    }
}

const detectionFunctions: ((one: Collider2d, two: Collider2d) => Contact | undefined)[][] =
[
//    Circle
    [ circle_circle, ], // Circle
];

function getColliderIndex(coll: Collider2d)
{
    for (let i = 0; i < ColliderList.length; i++)
    {
        if (coll instanceof ColliderList[i])
        {
            return i;
        }
    }
    return -1;
}

export function narrowPhaseDetection(one: Collider2d, two: Collider2d)
{
    let indexOne = getColliderIndex(one);
    let indexTwo = getColliderIndex(two);

    if (indexOne < 0 || indexTwo < 0)
    {
        throw new Error(`${one} or ${two} is not a valid collider!`);
    }

    let detectionFunction = detectionFunctions[indexOne][indexTwo];

    let contact = detectionFunction(one, two);
    
    return contact;
}