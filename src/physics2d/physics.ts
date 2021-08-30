import { Game2d } from "../game";
import { Collider2d, ColliderList } from "./collider";
import { Contact, narrowPhaseDetection } from "./detection";
import { QuadTree } from "./quadTree";
import { resolveContact } from "./resolution";
import { RigidBody2d } from "./rigidbody";

const COLLISION_ITERATIONS = 1;

export class Physics2d
{
    private colliderTree = new QuadTree<Collider2d>();

    constructor(private game: Game2d)
    {
        
    }

    /**
     * Physics:
     *  - collider earlyUpdate => calculating cm, moment of inertia
     *  - rigidbody earlyUpdate => calculating total cm, total moment of inertia, etc.
     *  - collider update => mainly for bounding box
     *  - reset octree
     *  - build octree
     *  - repeat COLLISION_ITERATIONS times: 
     *      - broad-phase collision detection
     *      - narrow-phase collision detection
     *      - collision resolution
     *  - rigidbody update (movement, forces, etc.)
     */
    update()
    {
        // COLLIDER EARLYUPDATE
        let allColliders: Collider2d[] = [];
        for (const colliderType of ColliderList)
        {
            let collidersOfType = this.game.getAllComponentsOfType(colliderType);
            
            for (let i = 0, n = collidersOfType.length; i < n; i++)
            {
                collidersOfType[i].earlyUpdate();
                allColliders.push(collidersOfType[i]);
            }
        }

        // RIGIDBODY EARLYUPDATE
        let allRigidbodies = this.game.getAllComponentsOfType(RigidBody2d);
        for (let i = 0, n = allRigidbodies.length; i < n; i++)
        {
            allRigidbodies[i].earlyUpdate();
        }

        // COLLIDER MAIN UPDATE AND INSERTION INTO QUADTREE
        this.colliderTree.clear();
        for (let i = 0, n = allColliders.length; i < n; i++)
        {
            allColliders[i].update();
            
            this.colliderTree.insert(allColliders[i]);
        }

        // BROAD-PHASE COLLISION DETECTION
        for (let iteration = 0; iteration < COLLISION_ITERATIONS; iteration++)
        {
            let contacts: Contact[] = []

            for (let i = 0, n = allColliders.length; i < n; i++)
            {
                let one = allColliders[i];

                if (!one.dynamic) continue;

                one.hasBeenCollisionDetected = true;

                this.colliderTree.forEachInRange(one.bounds, (two: Collider2d) =>
                {
                    if (two.hasBeenCollisionDetected)
                    {
                        // cancels out if objects are the same and ensures only detecting a collision between objects once
                        return;
                    }

                    this.game.debug.drawRect(one.bounds);
                    // this.game.debug.drawRect(two.bounds, { color: 0xffff00 });

                    // NARROW-PHASE COLLISION DETECTION
                    let narrowPhaseResult = narrowPhaseDetection(one, two);

                    if (narrowPhaseResult !== undefined)
                    {
                        contacts.push(narrowPhaseResult);
                    }
                });
            }

            // COLLISION RESOLUTION
            for (const contact of contacts)
            {
                resolveContact(contact);
            }
        }

        // RIGIDBODY RESOLUTION
        for (let i = 0, n = allRigidbodies.length; i < n; i++)
        {
            allRigidbodies[i].update();
        }
    }
}
