/// <reference path="./references.ts" />
var startSteering;
var startSteeringLoop;
var getNormalizedTheta;

module Engine {
    import Point = Data.Point;
    import Player = Data.Player;
    import GameState = Data.GameState;
    import WIDTH = Data.WIDTH;
    import HEIGHT = Data.HEIGHT;
    import Vector3 = THREE.Vector3;

    var TIMESTEP: number = 30;                  //Each logical time step is 30 milliseconds
    var FINE_SCALE: number = 4;                 //The scaling of finer grid used for collision compared to the grid
                                                //used for graphic
    var SPEED: number = 1.6 / TIMESTEP;         //The speed of all player in coarse grid per millisecond.
    var DELTA_THETA: number = 0.5 / TIMESTEP;   //Turning speed in degree per millisecond.
    var MAX_THETA = 4;                          //The maximum degree a player can turn.

    var obstacles = {};         //The grid for obstacles is on a finer scale than that for player pos
    var gameState: GameState;
    var graphicEngine: Graphics.Engine;

    function degreeToRadian(deg: number): number {
        return deg * Math.PI / 180;
    }
    DELTA_THETA = degreeToRadian(DELTA_THETA);
    MAX_THETA = degreeToRadian(MAX_THETA);
    var count = 0;

    function newPoint(X: number, Y: number): Point {
        return {x: X, y: Y};
    }

    // Return a random starting position and orientation for a player.
    function randomStart(): {pos: Point; dir: Vector3} {
        //stub for now, change later
        if (count == 0) {
            count++;
            return {pos: newPoint(50, 50), dir: new Vector3(3, 5, 0)};
        }
        else
            return {pos: newPoint(WIDTH-50, HEIGHT-50), dir: new Vector3(-1, -4, 0)};
    }

    function newPlayer(curPos: Point, normalizedTheta: number, dir: Vector3): Player {
        var player: Player = new Player();
        player.curPos = curPos;
        player.curTheta = 0;
        player.normalizedTheta = normalizedTheta;
        player.dir = dir.normalize();
        player.isDead = false;
        player.trail = new Array<Point> ();
        return player;
    }

    function newGameState(numPlayers: number): GameState {
        var gs: GameState = new GameState();
        gs.numPlayers = numPlayers;
        gs.players = new Array<Player> ();
        var tmp;
        for (var i = 0; i < numPlayers; i++) {
            tmp = randomStart();
            gs.players.push(newPlayer(tmp["pos"], 0, tmp["dir"]));
        }
        gs.recentlyDead = new Array<number> ();
        return gs;
    }

    function pointToString(p: Point): string {
        return Math.floor(p.x) + "," + Math.floor(p.y);
    }

    //Change a point on coarse grid to the corresponding point on fine grid.
    function scaleToFine(p: Point): Point {
        return {x: p.x * FINE_SCALE, y: p.y * FINE_SCALE};
    }

    //Given a point on fine grid, add an obstacle at that positon
    function addObstacle(playerID: number, p: Point): void {
        obstacles[playerID][pointToString(p)] = true;
    }



    function initialize(numPlayers: number) {
        gameState = newGameState(numPlayers);
        graphicEngine = new Graphics.Engine(gameState);
        (<any> startSteeringLoop) ();

        //Add the starting position of each player to obstacles
        var player: Player;
        for (var i = 0; i < gameState.numPlayers; i++) {
            player = gameState.players[i];
            obstacles[i] = {};
            addObstacle(i, scaleToFine(player.curPos));
        }

    }


    var zaxis: Vector3 = new Vector3(0, 0, 1);
    //Calculate the new position in coarse grid given current position (in coarse grid), orientation
    //and time elapsed.
    function move(player: Player, dt: number): Point {
        var distance: number = SPEED * dt;    //Distance traveled in dt milliseconds in coarse grid
        var pos: Point = player.curPos;
        var dir: Vector3 = player.dir;
        player.dir.applyAxisAngle(zaxis, player.curTheta);
        return {x: pos.x + distance * dir.x, y: pos.y + distance * dir.y};
    }

    var tolerance: number = DELTA_THETA / 2;
    function updateDir(player: Player, dt: number): void {
        var intendedTurn: number = player.normalizedTheta * MAX_THETA;
        var delta: number = intendedTurn - player.curTheta;
        if (Math.abs(delta) > tolerance) {
            var direction: number = (delta >= 0)? 1 : -1;
            delta = Math.abs(delta);
            delta = direction * Math.min(delta, DELTA_THETA * dt);
            player.curTheta += delta;
        }
    }

    //Check if the given position (in fine grid) has collided with any obstacles.
    function collide(pos: Point): boolean {
        var maxBound: number = WIDTH * FINE_SCALE;
        if (pos.x < 0 || pos.y < 0 || pos.x >= maxBound || pos.y >= maxBound) {
            return true;
        }

        for (var i = 0; i < gameState.numPlayers; i++) {
            if (gameState.players[i].isDead == false && obstacles[i][pointToString(pos)]) {
                return true;
            }
        }

        return false;
    }

    //Given current and next positions, return the grids in between, excluding the starting pos.
    function getLine(curPos: Point, newPos: Point): Point[]{
        var x0: number = Math.floor(curPos.x);
        var y0: number = Math.floor(curPos.y);
        var x1: number = Math.floor(newPos.x);
        var y1: number = Math.floor(newPos.y);

        var xo: number = x0;
        var yo: number = y0;

        var steep: boolean = Math.abs(y1 - y0) > Math.abs(x1 - x0);
        var tmp: number;
        if (steep) {
            //swap(x0, y0) and swap(x1, y1)
            tmp = x0;
            x0 = y0;
            y0 = tmp;
            tmp = x1;
            x1 = y1;
            y1 = tmp;
        }
        if (x0 > x1) {
            //swap(x0, x1) and swap(y0, y1)
            tmp = x0;
            x0 = x1;
            x1 = tmp;
            tmp = y0;
            y0 = y1;
            y1 = tmp;
        }

        var dx: number = x1 - x0;
        var dy: number = Math.abs(y1 - y0);
        var error: number = dx / 2;

        var sy: number = (y0 < y1) ? 1 : -1;

        var y: number = y0;

        var xa: number;
        var ya: number
        var res: Point[] = new Array<Point> ();
        for (var x = x0; x <= x1; x++){
            if (steep) {
                xa = y;
                ya = x;
            } else {
                xa = x;
                ya = y;
            }
            if (xa != xo || ya != yo)
                res.push(newPoint(xa, ya));

            error = error - dy;
            if (error < 0) {
                y = y + sy;
                error = error + dx;
            }
        }
        return res;
   }

   function AINormalizedTheta(playerID: number, player: Player): number {
        //a stub that do nothing for now
        return 0;
   }

   var start: number = null;
   function step(timestamp: number) {
        var dt: number;
        if (start == null) start = timestamp;
        dt = timestamp - start;
        start = timestamp;

        //Clear recently dead
        gameState.recentlyDead.length = 0;

        //Get player input for player 0 and update its normalized theta
        if (!gameState.players[0].isDead) {
            gameState.players[0].normalizedTheta = (<any> getNormalizedTheta) ();
        }

        //Update the normalized theta for all other players
        for (var i = 1; i < gameState.numPlayers; i++) {
            if (!gameState.players[i].isDead)
                gameState.players[i].normalizedTheta = AINormalizedTheta(i, gameState.players[i]);
        }

        var line: Point[];
        var player: Player;
        var nextPos: Point;

        for (var i = 0; i < gameState.numPlayers; i++) {
            player = gameState.players[i];
            if (player.isDead)
                continue;
            updateDir(player, dt);
            nextPos = move(player, dt);

            line = getLine(scaleToFine(player.curPos), scaleToFine(nextPos));
            for (var j = 0; j < line.length; j++) {
                if (collide(line[j])) {
                    gameState.recentlyDead.push(i);
                    break;
                } else {
                    addObstacle(i, line[j]);
                }
            }

            var len:number = gameState.recentlyDead.length;
            if (len == 0 || gameState.recentlyDead[len-1] != i) {
                line = getLine(player.curPos, nextPos);
                for (var j = 0; j < line.length; j++) {
                    player.trail.push(line[j]);
                }
                player.curPos = nextPos;
            }
        }

        //Update the status of players who died this step
        for (var i = 0; i < gameState.recentlyDead.length; i++) {
            gameState.players[gameState.recentlyDead[i]].isDead = true;
        }

        var numPlayerAlive: number = 0;
        for (var i = 0; i < gameState.numPlayers; i++) {
            if (!gameState.players[i].isDead)
                numPlayerAlive++;
        }

        if (numPlayerAlive >= 1)
            graphicEngine.render();
        else
            graphicEngine.gameOver();
        requestAnimationFrame(step);
   }

    $(document).ready(function() {
        (<any> startSteering) ();
        initialize(1);
        requestAnimationFrame(step);
    });
}


