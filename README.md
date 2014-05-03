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

        numPlayers: number;
        players: Player[];
        recentlyDead: number[];

    class Player:

        curPos: Point;
        normalizedTheta: number;
        isDead: boolean;
        trail: Point[];
        dir: Three.Vector3;  // The direction vector a player is facing


Graphics:

    class Engine:

        Engine(state: GameState);
        render();
        gameOver();
