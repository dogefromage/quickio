import { Component, Entity } from "../entity";
import { Vector2 } from 'quickio-math';

export class Transform2d extends Component
{
    private _position = new Vector2();
    get position()
    {
        return this._position;
    }
    
    public rotation = 0;
    
    private _scale = new Vector2([ 1, 1 ]);
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
