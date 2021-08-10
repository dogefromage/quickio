import { Component, Entity } from "../entity";
import { Vector2 } from "../vector";

export class Transform2d extends Component
{
    private _position = new Vector2();
    get position()
    {
        return this._position;
    }
    
    private _rotation = new Vector2();
    get rotation()
    {
        return this._rotation;
    }
    
    private _scale = new Vector2(1, 1);
    get scale()
    {
        return this._scale;
    }

    constructor(
        parent: Entity
    )
    {
        super(parent);
    }
}