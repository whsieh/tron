/// <reference path="./references.ts" />
module Engine {
    declare var Queue;

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
    var SPEED_SCALE_FACTOR_PER_LEVEL: number = 1.25;
    var MAX_THETA_SCALE_FACTOR_PER_LEVEL: number = 1.1;

    /* Global variables */
    var gameState: GameState = new GameState();
    var graphicEngine: Graphics.Engine = null;
    var collisionObjects: CollisionObject[][];
    var numObstacles: number;
    var startTimestamp: number = null;

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
        canCollide(player: GamePlayer): boolean;
        handleCollision(player: GamePlayer);
    }

    class Obstacle implements CollisionObject {
        pos: Point;

        constructor(pos: Point) {
            this.pos = pos;
        }

        canCollide(player: GamePlayer): boolean {
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

        canCollide(player: GamePlayer): boolean {
            return true;
        }

        handleCollision(player: GamePlayer) {
            goalReached();
        }
    }

    /* Function to initialize a Tron game. */
    export function initialize(gameCanvas: HTMLCanvasElement) {
        startTimestamp = null;
        numObstacles = 20;
        initializeGameState();
        if (graphicEngine == null)
            graphicEngine = new Graphics.Engine(gameState, gameCanvas);
        graphicEngine.render();
    }

    export function start() {
        setTimeout(function() {
            requestAnimationFrame(step);
        }, 2000);
    }

    /* Callback function for updating animation on screen. */
    export function step(timestamp: number) {
        if (!gameState.paused) {
            var dt: number;
            if (startTimestamp == null) startTimestamp = timestamp;
            dt = timestamp - startTimestamp;
            startTimestamp = timestamp;

            var player: GamePlayer = <GamePlayer> gameState.player;
            player.curPos = player.nextPos;

            //Get player input for player and update its normalized theta
            player.normalizedTheta = Steering.theta();

            updateDir(player, dt);
            player.nextPos = move(player, dt);

            var hitbox = player.getHitBox();
            for (var i = 0; i < hitbox.length; i++) {
                if (!isInBound(hitbox[i]))
                    continue;
                var p = mapToCollision(hitbox[i]);
                if (!isInBound(p, GRID_WIDTH, GRID_HEIGHT, 0))
                    continue;
                var obj: CollisionObject = collisionObjects[p.x][p.y];
                if (obj != null && obj.canCollide(player))
                    obj.handleCollision(player);
            }


        }
        graphicEngine.render();
        requestAnimationFrame(step);
    }

    function nextLevel() {
        gameState.score += 100;
        gameState.level++;
        numObstacles += 25;
        SPEED *= SPEED_SCALE_FACTOR_PER_LEVEL;
        MAX_THETA *= MAX_THETA_SCALE_FACTOR_PER_LEVEL;

        if (numObstacles > MAX_OBSTACLES)
            numObstacles = MAX_OBSTACLES;
        //Perserve the position, direction and other info about the player.
        gameState.obstacles = [];
        gameState.goal = null;
        initializeCollisionObjects();
        gameState.paused = false;
    }

    function goalReached() {
        gameState.paused = true;
        graphicEngine.goalReached(nextLevel);
    }

    /* Function for restarting the game after a Game over. */
    function restartGame() {
        initializeGameState(false);
    }

    /* Function for handling a game over event. */
    function gameOver() {
        gameState.paused = true;
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

    /* Function for initializing the new GameState. */
    function initializeGameState(forNewGame: boolean = true){
        gameState.paused = true;
        var initialPlayerData = randomStart();
        gameState.player = new GamePlayer(initialPlayerData["pos"], 0, initialPlayerData["dir"]);
        if (forNewGame) {
            gameState.score = 0;
            gameState.level = 1;
        }
        gameState.obstacles = [];
        gameState.goal = null;
        initializeCollisionObjects();
        gameState.paused = false;
    }

    /* Function for initialzing the CollisionObject's. */
    function initializeCollisionObjects(depth: number = 5): boolean{
        var player = gameState.player;
        collisionObjects = new Array<CollisionObject[]>(GRID_HEIGHT);
        for (var i = 0; i < collisionObjects.length; i++) {
            collisionObjects[i] = new Array<CollisionObject>(GRID_WIDTH);
            //Initialize with nulls
            for (var j = 0; j < collisionObjects[i].length; j++)
                collisionObjects[i][j] = null;
        }
        var occupied: Point[] = getSurroundingPoints(mapToCollision(player.curPos));

        //Create the obstacles
        for (var i = 0; i < numObstacles; i++) {
            var p = getRandomPoint(occupied);
            occupied.push(p);
            var obstacle = new Obstacle(collisionToMap(p));
            collisionObjects[p.x][p.y] = obstacle;
            gameState.obstacles.push(obstacle);
        }

        //Create goal
        var gp = createGoal();
        if (gp == null && depth <= 0)
            gp = getRandomPoint(occupied);
        if (gp != null) {
            var goal = new Goal(collisionToMap(gp));
            if (collisionObjects[gp.x][gp.y] != null)
                console.log("Weird conflict");
            collisionObjects[gp.x][gp.y] = goal;
            gameState.goal = goal;
            return true;
        } else {
            console.log("Cannot find suitable goal, regenerating map...");
            return initializeCollisionObjects(depth-1);
        }
    }

    function createGoal(low: number = 25): Point {
        var goalCandidates: Point[] = [];
        var  visited = []
        for (var i = 0; i < GRID_HEIGHT; i++) {
            var subArray = []
            for (var j = 0; j < GRID_WIDTH; j++) {
                subArray.push(false);
            }
            visited.push(subArray)
        }
        var queue = <any> new Queue();

        var start = mapToCollision(gameState.player.curPos);
        queue.enqueue({x: start.x, y: start.y, length: 0});
        visited[start.x][start.y] = true;

        while(!queue.isEmpty()) {
            var current = queue.dequeue();
            if (current.length >= low) {
                goalCandidates.push(newPoint(current.x, current.y));
            }
            var neighbors: Point[] = getNeighbors(newPoint(current.x, current.y));
            for (var i = 0; i < neighbors.length; i++) {
                var n: Point = neighbors[i];
                if (!visited[n.x][n.y] && collisionObjects[i][j] == null) {
                    queue.enqueue({x: n.x, y: n.y, length: current.length + 1});
                    visited[n.x][n.y] = true;
                }
            }
        }

        if (goalCandidates.length == 0)
            return null;
        else
            return goalCandidates[Math.floor(Math.random() * goalCandidates.length)];
    }

    function getNeighbors(p: Point, width: number = GRID_WIDTH, height: number = GRID_HEIGHT): Point[] {
        var neighbors = [];
        if (isInBound(newPoint(p.x - 1, p.y), width, height, 0))
            neighbors.push(newPoint(p.x - 1, p.y));
        if (isInBound(newPoint(p.x + 1, p.y), width, height, 0))
            neighbors.push(newPoint(p.x + 1, p.y));
        if (isInBound(newPoint(p.x, p.y - 1), width, height, 0))
            neighbors.push(newPoint(p.x, p.y - 1));
        if (isInBound(newPoint(p.x, p.y + 1), width, height, 0))
            neighbors.push(newPoint(p.x, p.y + 1));
        return neighbors;
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


