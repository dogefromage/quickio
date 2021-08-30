import { Bounds2, Vector2 } from 'quickio-math';

const TREE_BUCKET_SIZE = 4;

const BASE_SIZE = 100;

export type TreeData =
{
    bounds: Bounds2,
    [key: string]: any
};

export class QuadTree<T extends TreeData>
{
    private root: QuadNode<T>;

    private _size = 0;
    get size()
    {
        return this._size;
    }

    constructor()
    {
        this.root = new QuadNode<T>(-BASE_SIZE, -BASE_SIZE, BASE_SIZE, BASE_SIZE);
    }

    insert(data: T)
    {
        let bounds = data.bounds;

        if (containsBounds(this.root, bounds))
        {
            this.root.insert(data);
            this._size++;
        }
        else
        {
            // create new root larger than current root node
            
            // determine in which direction should old root node should be placed on new root
            let rootIsRight = (bounds.max.x - this.root.cx) < (this.root.ax - bounds.min.x);
            let rootIsBottom = (bounds.max.y - this.root.cy) < (this.root.ay - bounds.min.y);

            // find index which current root will be place on new root 
            let rootsNewIndex = (rootIsRight ? 1 : 0) + (rootIsBottom ? 2 : 0);

            // calculate bounds of new roots
            let newAx = rootIsRight ? (2 * this.root.ax - this.root.cx) : this.root.ax;
            let newAy = rootIsBottom ? (2 * this.root.ay - this.root.cy) : this.root.ay;
            let newCx = rootIsRight ? this.root.cx : (2 * this.root.cx - newAx);
            let newCy = rootIsBottom ? this.root.cy : (2 * this.root.cy - newAy);

            // create new node and make root
            let newRoot = new QuadNode<T>(newAx, newAy, newCx, newCy);
            newRoot.isLeaf = false;
            newRoot.children[rootsNewIndex] = this.root;
            this.root = newRoot;

            this.insert(data);
        }
    }

    forEach(callback: (data: T) => void)
    {
        this.root.forEach(callback);
    }

    forEachInRange(bounds: Bounds2, callback: (data: T) => void)
    {
        this.root.forEachInRange(bounds, callback);
    }

    isEmpty()
    {
        return (this._size == 0);
    }

    clear()
    {
        this.root = new QuadNode<T>(-BASE_SIZE, -BASE_SIZE, BASE_SIZE, BASE_SIZE);
        this._size = 0;
    }
}

function intersectsBounds(node: QuadNode<any>, bounds: Bounds2)
{
    return (node.cx >= bounds.min.x &&
            node.ax <= bounds.max.x &&
            node.cy >= bounds.min.y &&
            node.ay <= bounds.max.y);
}

function containsBounds(node: QuadNode<any>, bounds: Bounds2)
{
    return (node.cx >= bounds.max.x &&
            node.ax <= bounds.min.x &&
            node.cy >= bounds.max.y &&
            node.ay <= bounds.min.y);
}

/**
 * Let a quadnote be a rectangle spanned between corners A and C
 * A ( ax, ay )
 * C ( cx, cy )
 * 
 * B represents the midpoint between A and C
 * B ( bx, by )
 */

class QuadNode<T extends TreeData>
{
    public bx: number;
    public by: number;

    public children: (QuadNode<T> | null)[] = [ null, null, null, null ];
    public data: T[] = [];

    public isLeaf = true;

    constructor(
        public ax: number,
        public ay: number,
        public cx: number,
        public cy: number,
    )
    {
        this.bx = 0.5 * (ax + cx);
        this.by = 0.5 * (ay + cy);
    }
    
    insert(data: T)
    {
        if (this.isLeaf)
        {
            this.data.push(data);
            
            if (this.data.length > TREE_BUCKET_SIZE)
            {
                this.isLeaf = false;

                const temp = this.data;
                this.data = [];
                for (let i = 0, n = temp.length; i < n; i++)
                {
                    this.insert(temp[i]);
                }
            }
        }
        else
        {
            let sideL = data.bounds.max.x < this.bx,
                sideR = data.bounds.min.x > this.bx,
                sideT = data.bounds.max.y < this.by,
                sideB = data.bounds.min.y > this.by;
            
            if ((sideL || sideR) && (sideT || sideB)) // fits into one of 4 children
            {
                let childIndex = 0;
                if (sideR) childIndex += 1;
                if (sideB) childIndex += 2;

                if (this.children[childIndex] === null)
                {
                    let offX = sideR ? (this.cx - this.bx) : 0;
                    let offY = sideB ? (this.cy - this.by) : 0;
                    
                    let newNode = new QuadNode<T>(
                        this.ax + offX,
                        this.ay + offY,
                        this.bx + offX,
                        this.by + offY
                    );
                    this.children[childIndex] = newNode;
                }

                this.children[childIndex]!.insert(data);
            }
            else // does not fit into any child 
            {
                this.data.push(data);
            }
        }
    }

    forEach(callback: (data: T) => void)
    {
        for (let i = 0; i < 4; i++)
        {
            this.children[i]?.forEach(callback);
        }

        for (let i = 0, n = this.data.length; i < n; i++)
        {
            callback(this.data[i]);
        }
    }

    forEachInRange(bounds: Bounds2, callback: (data: T) => void)
    {
        if (!intersectsBounds(this, bounds))
        {
            return;
        }
        
        for (let i = 0; i < 4; i++)
        {
            this.children[i]?.forEachInRange(bounds, callback);
        }

        for (let i = 0, n = this.data.length; i < n; i++)
        {
            if (bounds.intersectsBounds2(this.data[i].bounds))
            {
                callback(this.data[i]);
            }
        }
    }
}










// export class QuadTree<T>
// {
//     private root: QuadNode<T>;

//     private _size = 0;
//     get size()
//     {
//         return this._size;
//     }

//     constructor(
//         public bounds: Bounds2)
//     {
//         this.root = new QuadNode<T>(this.bounds, 0);
//     }

//     insert(bounds: Bounds2, data: T)
//     {
//         this.root.insert(bounds, data)
//         this._size++;
//     }

//     forEach(callback: (bounds: Bounds2, data: T) => void)
//     {
//         this.root.forEach(callback);
//     }

//     forEachInRange(bounds: Bounds2, callback: (bounds: Bounds2, data: T) => void)
//     {
//         this.root.forEachInRange(bounds, callback);
//     }

//     isEmpty()
//     {
//         return (this._size == 0);
//     }

//     clear()
//     {
//         this.root = new QuadNode<T>(this.bounds, 0);
//     }
// }

// let qt = new QuadTree<any>(new Bounds2(Vector2.zero, Vector2.one));

// type TreeData<T> = [ Bounds2, T ];

// class QuadNode<T>
// {
//     private nextBounds: Bounds2[];
//     private hasSplit = false;
//     private data: TreeData<T>[] = [];
//     private children: QuadNode<T>[] = [];
//     private isLeaf = false;

//     constructor(
//         private bounds: Bounds2, 
//         private depth: number)
//     {
//         let A = bounds.min;
//         let B = bounds.min.copy().add(bounds.max).scale(0.5);
//         let C = bounds.max;
        
//         this.nextBounds = [
//             new Bounds2(new Vector2(A.x, A.y), new Vector2(B.x, B.y)),
//             new Bounds2(new Vector2(B.x, A.y), new Vector2(C.x, B.y)),
//             new Bounds2(new Vector2(A.x, B.y), new Vector2(B.x, C.y)),
//             new Bounds2(new Vector2(B.x, B.y), new Vector2(C.x, C.y))
//         ];
//     }

//     insert(bounds: Bounds2, data: T)
//     {
//         const x: TreeData<T> = [ bounds, data ];
        
//         if (this.isLeaf)
//         {
//             this.data.push(x);
            
//             if (this.data.length > TREE_BUCKET_SIZE)
//             {
//                 this.isLeaf = false;

//                 const temp = this.data;
//                 this.data = [];
//                 for (let i = 0, n = temp.length; i < n; i++)
//                 {
//                     this.insert(temp[i][0], temp[i][1]);
//                 }
//             }
//             return;
//         }

//         let fitsIntoBounds = false;
//         for (let i = 0; i < 4; i++)
//         {
//             if(this.nextBounds[i].intersectsBounds2(x[0]))
//             {
//                 if (!this.hasSplit)
//                 {
//                     this.split();
//                 }

//                 this.children[i].insert(x[0], x[1]);   // Go deeper into the tree
//                 fitsIntoBounds = true;
//                 break;
//             }
//         }

//         if(!fitsIntoBounds)
//         {
//             this.data.push(x);
//         }
//     }

//     split()
//     {
//         for (let i = 0; i < 4; i++)
//         {
//             this.children.push(new QuadNode(this.nextBounds[i], this.depth + 1));
//         }
        
//         this.hasSplit = true;
//     }

//     forEach(callback: (bounds: Bounds2, data: T) => void)
//     {
//         if (this.hasSplit)
//         {
//             for (let i = 0; i < 4; i++)
//             {
//                 this.children[i].forEach(callback);
//             }
//         }

//         for (let i = 0, n = this.data.length; i < n; i++)
//         {
//             callback(this.data[i][0], this.data[i][1]);
//         }
//     }
    
//     forEachInRange(bounds: Bounds2, callback: (bounds: Bounds2, data: T) => void)
//     {
//         if (!bounds.intersectsBounds2(this.bounds))
//         {
//             return;
//         }
        
//         if (this.hasSplit)
//         {
//             for (let i = 0; i < 4; i++)
//             {
//                 this.children[i].forEach(callback);
//             }
//         }

//         for (let i = 0, n = this.data.length; i < n; i++)
//         {
//             let data = this.data[i];
//             if (bounds.intersectsBounds2(data[0]))
//             {
//                 callback(data[0], data[1]);
//             }
//         }
//     }
// }