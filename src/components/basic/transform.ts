// import { Component, Entity } from "../entity";
// import { Matrix2, Matrix3, Vector2 } from 'quickio-math';

// export class Transform2d extends Component
// {
//     private _position = Vector2.zero;
//     get position()
//     {
//         return this._position;
//     }
    
//     public rotation = 0;
    
//     private _scale = Vector2.one;
//     get scale()
//     {
//         return this._scale;
//     }

//     private _parent: Transform2d | null = null;
//     get parent()
//     {
//         return this._parent;
//     }

//     private _transformationMatrix = Matrix3.identity;
//     get transformationMatrix()
//     {
//         return this._transformationMatrix;
//     }

//     private _children = new Set<Transform2d>();
    
//     start()
//     {

//     }

//     update()
//     {
//         this.updateTransform();
//     }

//     updateTransform()
//     {
//         let cos = Math.cos(this.rotation);
//         let sin = Math.sin(this.rotation);

//         let a = this.scale.x *  cos,
//             b = this.scale.x *  sin,
//             c = this.scale.y * -sin,
//             d = this.scale.y *  cos,
//             e = this.position.x,
//             f = this.position.y;

//         let localTransform = new Matrix3(
//         [
//             a, c, e,
//             b, d, f,
//             0, 0, 1
//         ]);

//         if (this.parent !== null)
//         {
//             let outerTransform = this.parent.transformationMatrix.copy();

//             this._transformationMatrix = outerTransform.multiply(localTransform);
//         }
//         else
//         {
//             this._transformationMatrix = localTransform;
//         }
//     }

//     transformPoint(point: Vector2)
//     {
//         return this._transformationMatrix.multiplyVec2(point);
//     }

//     inverseTransformPoint(point: Vector2)
//     {
//         let inv = this._transformationMatrix.inverse();
//         if (inv !== undefined)
//         {
//             return inv.multiplyVec2(point);
//         }
//         return point;
//     }

//     transformDirection(direction: Vector2)
//     {
//         let m = this._transformationMatrix.all();
//         let mat2 = new Matrix2([
//             m[0], m[1],
//             m[3], m[4]
//         ]);

//         return mat2.multiplyVec2(direction);
//     }

//     inverseTransformDirection(direction: Vector2)
//     {
//         let m = this._transformationMatrix.all();
//         let mat2 = new Matrix2([
//             m[0], m[1],
//             m[3], m[4]
//         ]).inverse();

//         if (mat2 !== undefined)
//         {
//             return mat2.multiplyVec2(direction);
//         }

//         return direction;
//     }

//     addChild(child: Transform2d)
//     {
//         this._children.add(child);
//         child._parent = this;

//         child.updateTransform();
//     }

//     removeChild(child: Transform2d)
//     {
//         this._children.delete(child);
//         child._parent = null;

//         child.updateTransform();
//     }

//     removeAllChildren()
//     {
//         for (const child of this.children)
//         {
//             child._parent = null;
            
//             child.updateTransform();
//         }
//         this._children.clear();
//     }

//     get children()
//     {
//         return this._children[Symbol.iterator]();
//     }
// }
