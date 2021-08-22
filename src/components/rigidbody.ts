import { Transform2d } from "./transform";
import { Component, Entity } from "../entity";
import { Game2d } from "../game";
import { Vector2 } from "quickio-math";

export class RigidBody2d extends Component
{
    private _velocity: Vector2 = new Vector2();
    get velocity()
    {
        return this._velocity;
    }

    public applyGravity = true;
    public allowRotation = true;

    public angularVelocity: number = 0;

    private transform!: Transform2d;

    start()
    {
        this.transform = this.entity.getComponent(Transform2d);
    }

    update()
    {
        // position
        let dt = this.game.deltaTime;

        let forces = new Vector2();
        if (this.applyGravity)
        {
            forces.add(this.game.constants.g);
        }

        
        this.velocity.add(forces.copy().scale(dt));
        this.transform.position.add(this.velocity.copy().scale(dt));
        
        // rotation
        let angularForce = 0;
        this.angularVelocity += angularForce * dt;
        this.transform.rotation += this.angularVelocity * dt;
    }
}