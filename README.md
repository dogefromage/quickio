
  

# quickio

>__quickio is still under development! Some features may still be missing...__
<p>
<p>

Hello user, <p>  

Quickio is a javascript/typescript game engine which runs inside of the browser. It is based on an [entity-component-system](https://en.wikipedia.org/wiki/Entity_component_system) like Unity3d. If you are already experienced in unity, quickio should be no problem for you. In the future, I am aiming to make quickio into a multiplayer engine to make it an easy way to create your own io-style game.

## Setup
For quickio, it is recommended to understand NodeJS and npm. Also I highly advise you to use typescript for your development, since it makes debugging a lot easier. Also the strong-ish typed style will make your script perform better inside your browser. 

If you are unsure on how to create a typescript or NodeJS application, check out the [quickio typescript starter project](https://github.com/dogefromage/quickio-starter-ts).

```bash
# download from npm
npm install quickio
```
```ts
// in your typescript file
import * as quick from 'quickio';
```
```js
// with nodejs
const quick = require('quickio');
```

## Starting out
Let us start out by retrieving the html5 canvas and also its 2d rendering context from our page.
```html
<body>
	<canvas width=600 height=600></canvas>
</body>
```

```ts
// Typescript
let canvas = document.querySelector('canvas');
let ctx = canvas.getContext('2d');
```
After importing the module, we can start creating our game and setting our rendering context.
  
```ts
import * as quick from 'quickio';

let game = new quick.Game2d();
game.start();

if (ctx) // check if undefined or null
{
	game.setRenderingContext(ctx);
}
```
## Entities
To create an object in our game, we use the following block of code:
```ts
let myEntity = game.addEntity();
```
To remove it we type:
```ts
game.removeEntity(myEntity);
```

## Components
### Built-in components
In quickio, your code will run on so-called components. There are some already built-in components like the Transform2d. If you have programmed in Unity3d, this should feel familiar. The Transform2d component can be used to move, rotate and scale an entity. It can also be used to parent objects to eachother.
All components can be retrieved using the following function, which takes in the class name as argument.
```ts
let transform2d = myEntity.getComponent(Transform2d);
transform2d.position.x += 5; // move by 5 units to the right

otherTransform2d.addChild(transform2d); 
// myEntity will now follow all movements of the parent object.
```
### Custom components
The true power of the entity-component-system is the ability to creaty your own components, which you can then attach to any entity. To create your own component you create a class, which extends from the quick.Component base class.
```ts
class MyComponent extends quick.Component
{ 
	start()
	{ 
		// start() will run once after the component has been attached to an entity.
		console.log('Hello world');
	}
	
	update()
	{
		// update() will run repeatitly every frame.
	}
}

let myComponentInstance = myEntity.addComponent(MyComponent);

let anotherComponentInstance = otherEntity.addComponent(MyComponent);
otherEntity.removeComponent(MyComponent);
```
Components can (and should normally) be accessed inside of custom components. It is __highly__ recommended to retrieve or add components inside of the start() function if possible.
```ts
// typescript

class MovePlayer extends quick.Component
{
	/**
	* if typescript strict mode is turned on, use the exclamation mark 
	* after the name to tell typescript that this property will not be
	* assigned inside of the constructor.
	*/ 
	public transform!: Transform2d;
	
	start()
	{
		// the entity property is accessible from all of its components.
		this.transform = this.entity.getComponent(Transform2d);
	}

	update()
	{
		let speed = 5;
		let movement = speed * this.game.deltaTime;
		this.transform.position.y += movement;
	}
}


// javascript

class MovePlayer extends quick.Component
{
	start()
	{
		// the entity property is accessible from all of its components.
		this.transform = this.entity.getComponent(Transform2d);
	}

	update()
	{
		let speed = 5;
		let movement = speed * this.game.deltaTime;
		this.transform.position.y += movement;
	}
}

```

## Rendering
Every entity receives a Renderer2d component upon creation, which can be retrieved to set a rendering style. You can add render steps to a Renderer2d by giving it a render shape and render style. These shapes will follow the transformation of you object. This way, you can translate, rotate and scale you shape using the Transform2d component.

Currently, the following shapes are supported and accessible under quick.PrimitiveShapes:
* Circle ( radius )
* Square ( sideLength )
* Rectangle ( width, height )
* NGon ( n, outerRadius )
* CustomShape ( listOfVertices )
 
```ts
// typescript or javascript

class MyComponent extends quick.Component
{
	start()
	{
		let  renderer  =  this.entity.getComponent(quick.Renderer2d);
		
		renderer.addRenderStep(
			new quick.PrimitiveShapes.NGon(5, 50),
			new quick.RenderStyle2d().fill(0xff6666).stroke(0x000000).lineWidth(3),
		);
	}
}
```
It is also possible to create  a custom rendering function. For this, you need to enter in a callback function which takes the rendering context as an argument. In this example, a custom renderStep is used to create a solid background for the game. Use the zDepth property to ensure that this will be drawn onto the canvas first.

```ts  
class Background extends quick.Component
{
	start()
	{
		let renderer = this.entity.getComponent(quick.Renderer2d);
		renderer.addRenderStep((ctx) =>
		{
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, canvasWidth, canvasHeight);
		});
		
		// zDepth of -1 will make background be behind of other objects (default zDepth is 0)
		renderer.zDepth = -1; 
	}
}

// quick way to create a entity and attach component
game.addEntity().addComponent(Background); 
```
## Camera
### coming soon!

## Physics
### coming soon!