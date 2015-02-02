/// <reference path="./references.ts" />
module Engine {
    /* Rename imports for easy reference */
    import Vector3 = THREE.Vector3;
    import Point = Data.Point;
    import Player = Data.Player;
    import MapObject = Data.MapObject;
    import GameState = Data.GameState;
    import WIDTH = Data.WIDTH;
    import HEIGHT = Data.HEIGHT;
    import GRID_WIDTH = Data.GRID_WIDTH;
    import GRID_HEIGHT = Data.GRID_HEIGHT;
    import PLAYER_LENGTH = Data.PLAYER_LENGTH;
    import PLAYER_WIDTH = Data.PLAYER_WIDTH;

    /* Constants */
    var TIMESTEP: number = 30;                  //Each logical time step is 30 milliseconds
    var SPEED: number = 1.6 / TIMESTEP;         //The speed of all player in map unit per millisecond.
    var DELTA_THETA: number = Util.degreeToRadian(0.5) / TIMESTEP;   //Turning speed in radian per millisecond.
    var MAX_THETA = Util.degreeToRadian(4);                          //The maximum radian a player can turn.
    var Z_AXIS: Vector3 = new Vector3(0, 0, 1);
    var MAX_OBSTACLES: number = 250;

    /* Global variables */
    var gameState: GameState;
    var graphicEngine: Graphics.Engine = null;
    var collisionObjects: CollisionObject[][];
    var numObstacles: number;
    var start: number = null;


    /* Interfaces and classes */
    class GamePlayer extends Player {
        nextPos: Point;

        constructor(curPos: Point, normalizedTheta: number, dir: THREE.Vector3) {
            super(curPos, normalizedTheta, dir);
            this.nextPos = curPos;
        }

        /* Get the hit box as a list of Points. */
        getHitBox(): Point[] {
            var hitbox = [];
            hitbox.push(this.curPos);
            
            var a = new Vector3();
            a.copy(this.dir);
            a.negate();
            a.setLength(PLAYER_LENGTH);
            var b = new Vector3();
            b.crossVectors(a, Z_AXIS);
            b.setLength(0.5 * PLAYER_WIDTH);
            var base = new Vector3(this.curPos.x + a.x, this.curPos.y + a.y, 0);
            hitbox.push(newPoint(base.x + b.x, base.y + b.y));
            hitbox.push(newPoint(base.x - b.x, base.y - b.y));

            return hitbox;
        }
    }

    interface CollisionObject extends MapObject {
        isCollided(player: GamePlayer): boolean;
        handleCollision(player: GamePlayer);
    }

    class Obstacle implements CollisionObject {
        pos: Point;

        constructor(pos: Point) {
            this.pos = pos;
        }

        isCollided(player: GamePlayer): boolean {
            return true;
        }

        handleCollision(player: GamePlayer) {
            gameOver();
        }
    }

    class Goal implements CollisionObject {
        pos: Point;

        constructor(pos: Point) {
            this.pos = pos;
        }

        isCollided(player: GamePlayer): boolean {
            /*var goalPos = mapToCollision(this.pos);
            var playerPos = mapToCollision(player.curPos);
            if (goalPos.x == playerPos.x && goalPos.y == playerPos.y)
                return true;
            return false;*/
            return true;
        }

        handleCollision(player: GamePlayer) {
            goalReached();
        }
    }

    /* Function to initialize a Tron game. */
    export function initialize(gameCanvas: HTMLCanvasElement) {
        numObstacles = 25;
        gameState = initializeGameState();
        if (graphicEngine == null)
            graphicEngine = new Graphics.Engine(gameState, gameCanvas);
        graphicEngine.render();
    }

    /* Callback function for updating animation on screen. */
    export function step(timestamp: number) {
        if (!gameState.isGameOver) {
            var dt: number;
            if (start == null) start = timestamp;
            dt = timestamp - start;
            start = timestamp;

            var player: GamePlayer = <GamePlayer> gameState.player;

            //Get player input for player and update its normalized theta
            player.normalizedTheta = Steering.theta();

            var line: Point[];
            var nextPos: Point;

            updateDir(player, dt);
            nextPos = move(player, dt);

            var hitbox = player.getHitBox();
            for (var i = 0; i < hitbox.length; i++) {
                if (!isInBound(hitbox[i]))
                    continue;
                var p = mapToCollision(hitbox[i]);
                if (!isInBound(p, GRID_WIDTH, GRID_HEIGHT, 0))
                    continue;
                var obj: CollisionObject = collisionObjects[p.x][p.y];
                if (obj != null && obj.isCollided(player))
                    obj.handleCollision(player);
            }

            player.curPos = nextPos;

        }
        graphicEngine.render();
        requestAnimationFrame(step);
    }

    function nextLevel() {
        gameState.score += 100;
        numObstacles += 25;
        if (numObstacles > MAX_OBSTACLES)
            numObstacles = MAX_OBSTACLES;
        gameState = initializeGameState();
    }

    function goalReached() {
        graphicEngine.goalReached(nextLevel);
    }

    /* Function for restarting the game after a Game over. */
    function restartGame() {
        initialize(null);
    }

    /* Function for handling a game over event. */
    function gameOver() {
        gameState.isGameOver = true;
        graphicEngine.gameOver(restartGame);
    }

    /* Return a new Point. */
    function newPoint(X: number, Y: number): Point {
        return {x: X, y: Y};
    }

    // Return a random starting position and orientation for a player.
    function randomStart(): {pos: Point; dir: Vector3} {
        return {pos: newPoint(50, 50), dir: new Vector3(3, 5, 0)};
    }

    /* Function for initializing and returning a new GameState. */
    function initializeGameState(): GameState {
        var gs: GameState = new GameState();
        var tmp;
        tmp = randomStart();
        gs.player = new GamePlayer(tmp["pos"], 0, tmp["dir"]);
        gs.isGameOver = false;
        gs.score = 0;
        gs.obstacles = [];
        collisionObjects = initializeCollisionObjects(gs);
        return gs;
    }

    /* Function for initialzing and returning a 2D array of CollisionObject. */
    function initializeCollisionObjects(gs: GameState): CollisionObject[][] {
        var player = gs.player;
        var co: CollisionObject[][] = new Array<CollisionObject[]>(GRID_HEIGHT);
        for (var i = 0; i < co.length; i++) {
            co[i] = new Array<CollisionObject>(GRID_WIDTH);
            //Initialize with nulls
            for (var j = 0; j < co[i].length; j++)
                co[i][j] = null;
        }
        var occupied: Point[] = getSurroundingPoints(mapToCollision(player.curPos));

        //Create the obstacles
        for (var i = 0; i < numObstacles; i++) {
            var p = getRandomPoint(occupied);
            occupied.push(p);
            var obstacle = new Obstacle(collisionToMap(p));
            co[p.x][p.y] = obstacle;
            gs.obstacles.push(obstacle);
        }

        //Create goal
        var p = getRandomPoint(occupied);
        var goal = new Goal(collisionToMap(p));
        co[p.x][p.y] = goal;
        gs.goal = goal;
        return co;
    }

    /* Return a ranomd Point with x,y-values between WIDTH and HEIGHT, and not in OCCUPIED. */
    function getRandomPoint(occupied: Point[], width: number = 20, height: number = 20): Point {
        var x: number;
        var y: number;
        var isDone: boolean;
        while(true) {
            isDone = true;
            x = Math.floor(Math.random()*width);
            y = Math.floor(Math.random()*height);
            for (var i = 0; i < occupied.length; i++) {
                var p = occupied[i];
                if (p.x == x && p.y == y) {
                    isDone = false;
                    break;
                }
            }
            if (isDone)
                break;
        }
        return newPoint(x, y);
    }

    /* Return a list of the Points surrounding P, including P. */
    function getSurroundingPoints(p: Point): Point[] {
        var sp = [];
        sp.push(newPoint(p.x-1, p.y+1));
        sp.push(newPoint(p.x, p.y+1));
        sp.push(newPoint(p.x+1, p.y+1));
        sp.push(newPoint(p.x-1, p.y));
        sp.push(newPoint(p.x, p.y));
        sp.push(newPoint(p.x+1, p.y));
        sp.push(newPoint(p.x-1, p.y-1));
        sp.push(newPoint(p.x, p.y-1));
        sp.push(newPoint(p.x+1, p.y-1));
        return sp;
    }

    /* Function for converting a Point to string. */
    function pointToString(p: Point): string {
        return Math.floor(p.x) + "," + Math.floor(p.y);
    }

    function isInBound(pos: Point, width: number = WIDTH, height: number = HEIGHT, margin: number = 3) {
        return (-margin <= pos.x && pos.x < width + margin) &&
             (-margin <= pos.y && pos.y < height + margin);
    }

    /* Convert a point on overall map to the corresponding point on collision grid. */
    function mapToCollision(p: Point): Point {
        return {x: Math.floor(p.x * 1.0 * GRID_WIDTH / WIDTH), y: Math.floor(p.y * 1.0 * GRID_HEIGHT / HEIGHT)};
    }

    /* Convert a point on collision grid to the corresponding point on overall map. */
    function collisionToMap(p: Point): Point {
        return {x: p.x * WIDTH / GRID_WIDTH, y: p.y * HEIGHT / GRID_HEIGHT};
    }

    /* Calculate the new position in overall map given current position (in overall map), orientation
     * and time elapsed. */
    function move(player: Player, dt: number): Point {
        var distance: number = SPEED * dt;    //Distance traveled in dt milliseconds on overall map
        var pos: Point = player.curPos;
        var dir: Vector3 = player.dir;
        player.dir.applyAxisAngle(Z_AXIS, player.curTheta);
        return {x: pos.x + distance * dir.x, y: pos.y + distance * dir.y};
    }

    var tolerance: number = DELTA_THETA / 2;
    /* Function for updating the direction a PLAYER is facing in DT milliseconds. */
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
    function isCollided(pos: Point): boolean {
        // var maxBound: number = WIDTH * COLLISION_SCALE;
        // if (pos.x < 0 || pos.y < 0 || pos.x >= maxBound || pos.y >= maxBound) {
        //     return true;
        // }

        // for (var i = 0; i < gameState.numPlayers; i++) {
        //     if (gameState.players[i].isDead == false && obstacles[i][pointToString(pos)]) {
        //         return true;
        //     }
        // }

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

}


