
enum GOTypes
{
    Player,
    Gagi
}

export const gameObjectClassList: GameObjectTemplate[] = 
[
    {
        type: GOTypes.Player,
        class: PlayerClass,
    },
    {
        type: GOTypes.Enemy,
        class: EnemyClass,
    },
];

// server
const serverGame = new ServerGame(gameObjectClassList);

// clietn
const clientGame = new ClientGame(gameObjectClassList);

requestAnimationFrame(() =>
{
    clientGame.update();

    // 2d canvas
    clientGame.world.draw();
    clientGame.allPlayers.draw();
    
    // threejs
    three.render(scene);
});

