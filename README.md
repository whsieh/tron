tron
====

Simple 3d TRON game using webcam steering.

The best interface in the world...

Steering:

    class Controller:

        Controller();
        // number on the interval [-1, 1]
        getNormalizedTheta(): number;

Data:

    class GameState:

        player: Player;
        obstacles: MapObject[];
        goal: MapObject;
        score: number;                          //Number of times the game is won.
        isGameOver: boolean;

    class Player:

        curPos: Point;
        curTheta: number;
        normalizedTheta: number;
        dir: THREE.Vector3;
        /* The base (bottom) of the player is a triangle with the tip at CURPOS. */
        length: number = 21;                    //The height of the triangular base.
        width: number = 12;                     //The width of the triangular base.

Engine:

    initialize(gameCanvas: HTMLCanvasElement);
    start();

Graphics:

    class Engine:

        Engine(state: GameState);
        render();
        gameOver();
