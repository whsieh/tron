/// <reference path="./references.ts" />
module Engine {
    import Point = Data.Point;
    import Player = Data.Player;
    import GameState = Data.GameState;

    var TIMESTEP: number = 30;  //Each logical time step is 30 milliseconds
    var WIDTH: number = 1000;
    var HEIGHT: number = 1000;

    function newPoint(X: number, Y: number): Data.Point {
        return {x: X, y: Y};
    }

    function newPlayer(curPos: Point, normalizedTheta: number, lookAt: Point): Player {
        var player: Player = new Player();
        player.curPos = curPos;
        player.normalizedTheta = normalizedTheta;
        player.lookAt = lookAt;
        player.isDead = false;
        player.trail = new Array<Point> ();
        return player;
    }

    function newGameState(numPlayers: number, width = WIDTH, height = HEIGHT): GameState {
        var gs: GameState = new GameState();
        gs.width = width;
        gs.height = height;
        gs.numPlayers = numPlayers;
        gs.players = new Array<Player> ();
        gs.recentlyDead = new Array<number> ();
        return gs;
    }
}
