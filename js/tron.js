var Util;
(function (Util) {
    function degreeToRadian(deg) {
        return deg * Math.PI / 180;
    }
    Util.degreeToRadian = degreeToRadian;

    function bind(ctx, func) {
        return function () {
            func.apply(ctx, arguments);
        };
    }
    Util.bind = bind;

    function findFirstElementFromId(id) {
        var elementId = id.charAt(0) == "#" ? id : ("#" + id);
        var matchingElements = $(elementId);
        return matchingElements.size() == 0 ? null : matchingElements[0];
    }
    Util.findFirstElementFromId = findFirstElementFromId;

    var Color = (function () {
        function Color() {
            this.r = 0;
            this.g = 0;
            this.b = 0;
        }
        return Color;
    })();
    Util.Color = Color;

    var RGBData = (function () {
        function RGBData(width, height) {
            this.width = width;
            this.height = height;
        }
        RGBData.prototype.setFrame = function (imageData) {
            this.imageData = imageData;
        };

        RGBData.prototype.getFrame = function () {
            return this.imageData;
        };

        RGBData.prototype.getPixelColor = function (i, j, pixel) {
            var index = i * 4 + j * 4 * this.width;
            pixel.r = this.imageData.data[index + 0];
            pixel.g = this.imageData.data[index + 1];
            pixel.b = this.imageData.data[index + 2];
        };

        RGBData.prototype.setPixelColor = function (i, j, pixel) {
            var index = i * 4 + j * 4 * this.width;
            this.imageData.data[index + 0] = pixel.r;
            this.imageData.data[index + 1] = pixel.g;
            this.imageData.data[index + 2] = pixel.b;
        };
        return RGBData;
    })();
    Util.RGBData = RGBData;

    function roundColor(color) {
        var c;
        c.r = Math.round(color.r);
        c.g = Math.round(color.g);
        c.b = Math.round(color.b);
        return c;
    }
    Util.roundColor = roundColor;

    var nav = navigator;

    function hasGetUserMedia() {
        return !!(nav.getUserMedia || nav.webkitGetUserMedia || nav.mozGetUserMedia || nav.msGetUserMedia);
    }

    function getUserMedia(constraints, streamHandler, errorHandler) {
        (nav.getUserMedia || nav.webkitGetUserMedia || nav.mozGetUserMedia || nav.msGetUserMedia).call(nav, constraints, streamHandler, errorHandler);
    }

    var Camera = (function () {
        function Camera(video, canvas, errorHandler) {
            this.isReady = false;
            this.isCapturing = false;
            if (!hasGetUserMedia())
                return errorHandler({ name: "Unsupported" });

            getUserMedia({ video: true }, bind(this, function (stream) {
                this.video.src = URL.createObjectURL(stream);
            }), errorHandler);

            $(video).on("loadedmetadata", bind(this, function () {
                this.destinationWidth = this.video.width;
                this.destinationHeight = this.video.height;
                this.sourceWidth = this.video.videoWidth;
                this.sourceHeight = this.video.videoHeight;
                this.isReady = true;
            }));

            this.renderCameraOverlay = null;
            this.video = video;
            this.canvas = canvas;
            this.context = canvas.getContext("2d");
        }
        Camera.prototype.setRenderCameraOverlay = function (renderCameraOverlay) {
            this.renderCameraOverlay = renderCameraOverlay;
        };

        Camera.prototype.setDisplayCanvas = function (canvas) {
            this.canvas = canvas;
            this.context = canvas.getContext("2d");
        };

        Camera.prototype.ready = function () {
            return this.isReady;
        };

        Camera.prototype.start = function () {
            if (!this.ready())
                return;
            this.video.play();
            this.isCapturing = true;
            requestAnimationFrame(bind(this, this.draw));
        };

        Camera.prototype.stop = function () {
            this.video.pause();
            this.isCapturing = false;
        };

        Camera.prototype.draw = function () {
            var sx = (this.video.videoWidth - this.sourceWidth) / 2;
            var sy = (this.video.videoHeight - this.sourceHeight) / 2;

            this.context.drawImage(this.video, sx, sy, this.sourceWidth, this.sourceHeight, 0, 0, this.destinationWidth, this.destinationHeight);
            if (this.renderCameraOverlay != null)
                this.renderCameraOverlay(this.context);

            if (this.isCapturing)
                requestAnimationFrame(bind(this, this.draw));
        };

        Camera.prototype.cropResize = function (width, height) {
            if (!this.ready())
                return;
            this.destinationWidth = width;
            this.destinationHeight = height;
            var aspectRatio = width / height;
            if (aspectRatio * this.video.videoHeight > this.video.videoWidth) {
                this.sourceWidth = this.video.videoWidth;
                this.sourceHeight = this.video.videoWidth / aspectRatio;
            } else {
                this.sourceWidth = this.video.videoHeight * aspectRatio;
                this.sourceHeight = this.video.videoHeight;
            }

            this.canvas.width = this.destinationWidth;
            this.canvas.height = this.destinationHeight;
        };

        Camera.prototype.getFrame = function () {
            if (!this.ready() || !this.isCapturing)
                return;
            return this.context.getImageData(0, 0, this.destinationWidth, this.destinationHeight);
        };

        Camera.prototype.width = function () {
            if (!this.ready())
                return 0;

            return this.destinationWidth;
        };

        Camera.prototype.height = function () {
            if (!this.ready())
                return 0;

            return this.destinationHeight;
        };
        return Camera;
    })();
    Util.Camera = Camera;
})(Util || (Util = {}));
var Setup;
(function (Setup) {
    function getAverageColor(data, left, top, width, height) {
        var accumulatedColor = { r: 0, g: 0, b: 0 };
        var color = { r: 0, g: 0, b: 0 };
        var numPixelsSampled = 0;
        for (var i = left; i < left + width; i++) {
            for (var j = top; j < top + height; j++) {
                data.getPixelColor(i, j, color);
                accumulatedColor.r += color.r;
                accumulatedColor.g += color.g;
                accumulatedColor.b += color.b;
                numPixelsSampled++;
            }
        }

        accumulatedColor.r = accumulatedColor.r / numPixelsSampled;
        accumulatedColor.g = accumulatedColor.g / numPixelsSampled;
        accumulatedColor.b = accumulatedColor.b / numPixelsSampled;

        return accumulatedColor;
    }
    Setup.getAverageColor = getAverageColor;
})(Setup || (Setup = {}));
var Steering;
(function (Steering) {
    

    var camera = null;
    var skinColor = null;
    var rgbData = null;
    var canvas = null;
    var lastKnownLeftAvgPixel;
    var lastKnownRightAvgPixel;

    var isCurrentlyDetectingHands;
    var samplingStride;
    var id = null;
    var currentRawTheta;
    var minPointCountThreshold;
    var updateAlpha;

    function setup(_camera, _skinColor, _updateAlpha, _samplingStride, _minPointCountThreshold) {
        if (typeof _updateAlpha === "undefined") { _updateAlpha = 0.75; }
        if (typeof _samplingStride === "undefined") { _samplingStride = 2; }
        if (typeof _minPointCountThreshold === "undefined") { _minPointCountThreshold = 10; }
        camera = _camera;
        skinColor = _skinColor;
        rgbData = new Util.RGBData(camera.width(), camera.height());
        updateAlpha = _updateAlpha;
        samplingStride = _samplingStride;
        minPointCountThreshold = _minPointCountThreshold;
        currentRawTheta = 0;
        lastKnownLeftAvgPixel = { x: 0, y: 0 };
        lastKnownRightAvgPixel = { x: 0, y: 0 };
        isCurrentlyDetectingHands = false;
    }
    Steering.setup = setup;

    function start(pollFrequency) {
        if (camera == null || !camera.ready() || skinColor == null)
            return;

        id = window.setInterval(Util.bind(this, function () {
            calculateSteeringTheta();
        }), 1000 / pollFrequency);
    }
    Steering.start = start;

    function stop() {
        if (id !== null)
            window.clearInterval(id);
        id = null;
    }
    Steering.stop = stop;

    function getSkinColor() {
        return skinColor;
    }
    Steering.getSkinColor = getSkinColor;

    function isActivelySteering() {
        return isCurrentlyDetectingHands;
    }
    Steering.isActivelySteering = isActivelySteering;

    function calculateSteeringTheta() {
        rgbData.setFrame(camera.getFrame());

        var color = new Util.Color();
        var dist;
        var halfWidth = rgbData.width / 2;

        var skinPixels = [];
        var baseSkinColorThreshold = 1500;

        for (var i = 0; i < rgbData.width; i += samplingStride) {
            var centerDistanceCoefficient = Math.abs(i - halfWidth) / halfWidth;
            for (var j = 0; j < rgbData.height; j += samplingStride) {
                rgbData.getPixelColor(i, j, color);
                dist = Math.pow(color.r - skinColor.r, 2) + Math.pow(color.g - skinColor.g, 2) + Math.pow(color.b - skinColor.b, 2);
                if (dist < baseSkinColorThreshold * centerDistanceCoefficient)
                    skinPixels.push({ x: i, y: j });
            }
        }

        var leftAvgPixel = { x: 0, y: 0 };
        var rightAvgPixel = { x: 0, y: 0 };
        var pixel;

        var leftPixelCount = 0;
        var rightPixelCount = 0;
        for (var i = 0; i < skinPixels.length; i++) {
            pixel = skinPixels[i];

            if (pixel.x < halfWidth) {
                leftAvgPixel.x += pixel.x;
                leftAvgPixel.y += pixel.y;
                leftPixelCount++;
            } else {
                rightAvgPixel.x += pixel.x;
                rightAvgPixel.y += pixel.y;
                rightPixelCount++;
            }
        }
        isCurrentlyDetectingHands = leftPixelCount >= minPointCountThreshold && rightPixelCount >= minPointCountThreshold;
        if (isCurrentlyDetectingHands) {
            leftAvgPixel.x /= leftPixelCount;
            leftAvgPixel.y /= leftPixelCount;
            rightAvgPixel.x /= rightPixelCount;
            rightAvgPixel.y /= rightPixelCount;
            lastKnownLeftAvgPixel = leftAvgPixel;
            lastKnownRightAvgPixel = rightAvgPixel;

            var updatedRawTheta = 0;
            if (rightAvgPixel.x != leftAvgPixel.x) {
                updatedRawTheta = Math.asin((rightAvgPixel.y - leftAvgPixel.y) / (rightAvgPixel.x - leftAvgPixel.x));
            }
            updatedRawTheta = (updateAlpha * updatedRawTheta) + ((1 - updateAlpha) * currentRawTheta);
            if (!isNaN(updatedRawTheta) && isFinite(updatedRawTheta))
                currentRawTheta = updatedRawTheta;
        }

        if (canvas != null) {
            var context = canvas.getContext("2d");
            context.clearRect(0, 0, rgbData.width, rgbData.height);
            context.fillStyle = "rgb(0, 0, 0)";
            for (var i = 0; i < skinPixels.length; i++) {
                pixel = skinPixels[i];
                context.fillRect(rgbData.width - pixel.x + 1, pixel.y - 1, 3, 3);
            }
            context.fillStyle = "rgb(255, 0, 0)";
            context.fillRect(rgbData.width - lastKnownLeftAvgPixel.x + 2, lastKnownLeftAvgPixel.y - 2, 5, 5);
            context.fillRect(rgbData.width - lastKnownRightAvgPixel.x + 2, lastKnownRightAvgPixel.y - 2, 5, 5);
        }
    }

    function setDisplayCanvas(_canvas) {
        canvas = _canvas;
    }
    Steering.setDisplayCanvas = setDisplayCanvas;

    function theta() {
        return 2.0 * currentRawTheta / Math.PI;
    }
    Steering.theta = theta;
})(Steering || (Steering = {}));
var Data;
(function (Data) {
    Data.WIDTH = 1000;
    Data.HEIGHT = 1000;

    Data.GRID_WIDTH = 20;
    Data.GRID_HEIGHT = 20;

    Data.PLAYER_LENGTH = 21;
    Data.PLAYER_WIDTH = 12;

    var Player = (function () {
        function Player(curPos, normalizedTheta, dir) {
            this.curPos = curPos;
            this.curTheta = 0;
            this.normalizedTheta = normalizedTheta;
            this.dir = dir.normalize();
        }
        return Player;
    })();
    Data.Player = Player;

    

    var GameState = (function () {
        function GameState() {
        }
        return GameState;
    })();
    Data.GameState = GameState;
})(Data || (Data = {}));
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Engine;
(function (Engine) {
    var Vector3 = THREE.Vector3;

    var Player = Data.Player;

    var GameState = Data.GameState;
    var WIDTH = Data.WIDTH;
    var HEIGHT = Data.HEIGHT;
    var GRID_WIDTH = Data.GRID_WIDTH;
    var GRID_HEIGHT = Data.GRID_HEIGHT;
    var PLAYER_LENGTH = Data.PLAYER_LENGTH;
    var PLAYER_WIDTH = Data.PLAYER_WIDTH;

    var TIMESTEP = 30;
    var SPEED = 1.6 / TIMESTEP;
    var DELTA_THETA = Util.degreeToRadian(0.5) / TIMESTEP;
    var MAX_THETA = Util.degreeToRadian(3);
    var Z_AXIS = new Vector3(0, 0, 1);
    var MAX_STATIC_OBSTACLES = 45;
    var MAX_FLOATING_OBSTACLES = 85;

    var SPEED_SCALE_FACTOR_PER_LEVEL = 1.15;
    var MAX_THETA_SCALE_FACTOR_PER_LEVEL = 1.1;
    var SPEED_LIMIT = 3 / TIMESTEP;
    var MAX_THETA_LIMIT = Util.degreeToRadian(10);

    var FLOATING_OBSTACLE_SPEED = 1.2 / TIMESTEP;
    var FLOATING_OBSTACLE_MAX_HEIGHT = 100;
    var FLOATING_OBSTACLE_COLLISION_THRESHOLD = 12;

    var gameState = new GameState();
    var graphicEngine = null;
    var collisionObjects;
    var floatingObstacles;
    var numStaticObstacles;
    var numFloatingObstacles;
    var startTimestamp = null;

    var GamePlayer = (function (_super) {
        __extends(GamePlayer, _super);
        function GamePlayer(curPos, normalizedTheta, dir) {
            _super.call(this, curPos, normalizedTheta, dir);
            this.nextPos = curPos;
        }
        GamePlayer.prototype.getHitBox = function () {
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
        };
        return GamePlayer;
    })(Player);

    var Obstacle = (function () {
        function Obstacle(pos) {
            this.color = 0xFF0000;
            this.pos = pos;
        }
        Obstacle.prototype.canCollide = function (player) {
            return true;
        };

        Obstacle.prototype.handleCollision = function (player) {
            updateScore(gameState.score - 25);
            gameOver();
        };
        return Obstacle;
    })();

    var FloatingObstacle = (function (_super) {
        __extends(FloatingObstacle, _super);
        function FloatingObstacle() {
            _super.apply(this, arguments);
        }
        FloatingObstacle.prototype.canCollide = function (player) {
            return this.pos.z < FLOATING_OBSTACLE_COLLISION_THRESHOLD;
        };
        return FloatingObstacle;
    })(Obstacle);

    var Goal = (function () {
        function Goal(pos) {
            this.pos = pos;
        }
        Goal.prototype.canCollide = function (player) {
            return true;
        };

        Goal.prototype.handleCollision = function (player) {
            goalReached();
        };
        return Goal;
    })();

    function initialize(gameCanvas) {
        startTimestamp = null;
        numStaticObstacles = 10;
        numFloatingObstacles = 10;
        initializeGameState();
        if (graphicEngine == null)
            graphicEngine = new Graphics.Engine(gameState, gameCanvas);
        graphicEngine.render();
    }
    Engine.initialize = initialize;

    function start() {
        setTimeout(function () {
            requestAnimationFrame(step);
        }, 2000);
    }
    Engine.start = start;

    function step(timestamp) {
        if (!gameState.paused) {
            var dt;
            if (startTimestamp == null)
                startTimestamp = timestamp;
            dt = timestamp - startTimestamp;
            startTimestamp = timestamp;

            var player = gameState.player;
            player.curPos = player.nextPos;

            player.normalizedTheta = Steering.theta();

            updateDir(player, dt);
            player.nextPos = move(player, dt);

            for (var i = 0; i < floatingObstacles.length; i++) {
                var floatingObstacle = floatingObstacles[i];
                floatingObstacle.pos.z += (floatingObstacle.isMovingUp ? FLOATING_OBSTACLE_SPEED * dt : -FLOATING_OBSTACLE_SPEED * dt);
                if (floatingObstacle.pos.z > FLOATING_OBSTACLE_MAX_HEIGHT) {
                    floatingObstacle.pos.z = FLOATING_OBSTACLE_MAX_HEIGHT;
                    floatingObstacle.isMovingUp = false;
                } else if (floatingObstacle.pos.z < 0) {
                    floatingObstacle.pos.z = 0;
                    floatingObstacle.isMovingUp = true;
                }
            }

            var hitbox = player.getHitBox();
            for (var i = 0; i < hitbox.length; i++) {
                if (!isInBound(hitbox[i]))
                    updateScore(gameState.score - (dt / 500));

                var p = mapToCollision(hitbox[i]);
                if (!isInBound(p, GRID_WIDTH, GRID_HEIGHT, 0))
                    continue;
                var obj = collisionObjects[p.x][p.y];
                if (obj != null && obj.canCollide(player))
                    obj.handleCollision(player);
            }
        }
        graphicEngine.render();
        requestAnimationFrame(step);
    }
    Engine.step = step;

    function updateScore(score) {
        score = Math.max(0, score);
        gameState.score = score;
        document.getElementById("score-display").textContent = "Score: " + String(Math.round(score));
    }

    function updateLevel(level) {
        gameState.level = level;
        document.getElementById("level-display").textContent = "Level: " + String(level);
    }

    function nextLevel() {
        updateScore(gameState.score + 100);
        updateLevel(gameState.level + 1);
        numStaticObstacles += 10;
        numFloatingObstacles += 10;
        SPEED *= SPEED_SCALE_FACTOR_PER_LEVEL;
        MAX_THETA *= MAX_THETA_SCALE_FACTOR_PER_LEVEL;

        if (SPEED > SPEED_LIMIT)
            SPEED = SPEED_LIMIT;
        if (MAX_THETA > MAX_THETA_LIMIT)
            MAX_THETA = MAX_THETA_LIMIT;

        if (numStaticObstacles > MAX_STATIC_OBSTACLES)
            numStaticObstacles = MAX_STATIC_OBSTACLES;
        if (numFloatingObstacles > MAX_FLOATING_OBSTACLES)
            numFloatingObstacles = MAX_FLOATING_OBSTACLES;

        gameState.obstacles = [];
        gameState.goal = null;
        initializeCollisionObjects();
        gameState.paused = false;
    }

    function goalReached() {
        gameState.paused = true;
        graphicEngine.goalReached(nextLevel);
    }

    function restartGame() {
        initializeGameState(false);
    }

    function gameOver() {
        gameState.paused = true;
        graphicEngine.gameOver(restartGame);
    }

    function newPoint(X, Y) {
        return { x: X, y: Y };
    }

    function randomStart() {
        return { pos: newPoint(50, 50), dir: new Vector3(3, 5, 0) };
    }

    function initializeGameState(forNewGame) {
        if (typeof forNewGame === "undefined") { forNewGame = true; }
        gameState.paused = true;
        var initialPlayerData = randomStart();
        gameState.player = new GamePlayer(initialPlayerData["pos"], 0, initialPlayerData["dir"]);
        if (forNewGame) {
            updateScore(0);
            updateLevel(1);
        }
        gameState.obstacles = [];
        gameState.goal = null;
        initializeCollisionObjects();
        gameState.paused = false;
    }

    function initializeCollisionObjects(depth) {
        if (typeof depth === "undefined") { depth = 5; }
        var player = gameState.player;
        gameState.obstacles = [];
        collisionObjects = new Array(GRID_HEIGHT);
        for (var i = 0; i < collisionObjects.length; i++) {
            collisionObjects[i] = new Array(GRID_WIDTH);

            for (var j = 0; j < collisionObjects[i].length; j++)
                collisionObjects[i][j] = null;
        }
        var occupied = getSurroundingPoints(mapToCollision(player.curPos));

        for (var i = 0; i < numStaticObstacles; i++) {
            var p = getRandomPoint(occupied);
            occupied.push(p);
            var obstaclePos = collisionToMap(p);
            obstaclePos.z = 0;
            var obstacle = new Obstacle(obstaclePos);
            obstacle.color = 0xFF0000;
            collisionObjects[p.x][p.y] = obstacle;
            gameState.obstacles.push(obstacle);
        }

        floatingObstacles = new Array();
        for (var i = 0; i < numFloatingObstacles; i++) {
            var p = getRandomPoint(occupied);
            occupied.push(p);
            var obstaclePos = collisionToMap(p);
            obstaclePos.z = Math.floor(Math.random() * FLOATING_OBSTACLE_MAX_HEIGHT);
            var floatingObstacle = new FloatingObstacle(obstaclePos);
            floatingObstacle.isMovingUp = !!Math.floor(Math.random() * 2);
            floatingObstacle.color = 0xFF8000;
            collisionObjects[p.x][p.y] = floatingObstacle;
            gameState.obstacles.push(floatingObstacle);
            floatingObstacles.push(floatingObstacle);
        }

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
            return initializeCollisionObjects(depth - 1);
        }
    }

    function createGoal(low) {
        if (typeof low === "undefined") { low = 25; }
        var goalCandidates = [];
        var visited = [];
        for (var i = 0; i < GRID_HEIGHT; i++) {
            var subArray = [];
            for (var j = 0; j < GRID_WIDTH; j++) {
                subArray.push(false);
            }
            visited.push(subArray);
        }
        var queue = new Queue();

        var start = mapToCollision(gameState.player.curPos);
        queue.enqueue({ x: start.x, y: start.y, length: 0 });
        visited[start.x][start.y] = true;

        while (!queue.isEmpty()) {
            var current = queue.dequeue();
            if (current.length >= low) {
                goalCandidates.push(newPoint(current.x, current.y));
            }
            var neighbors = getNeighbors(newPoint(current.x, current.y));
            for (var i = 0; i < neighbors.length; i++) {
                var n = neighbors[i];
                if (!visited[n.x][n.y] && collisionObjects[i][j] == null) {
                    queue.enqueue({ x: n.x, y: n.y, length: current.length + 1 });
                    visited[n.x][n.y] = true;
                }
            }
        }

        if (goalCandidates.length == 0)
            return null;
        else
            return goalCandidates[Math.floor(Math.random() * goalCandidates.length)];
    }

    function getNeighbors(p, width, height) {
        if (typeof width === "undefined") { width = GRID_WIDTH; }
        if (typeof height === "undefined") { height = GRID_HEIGHT; }
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

    function getRandomPoint(occupied, width, height) {
        if (typeof width === "undefined") { width = 20; }
        if (typeof height === "undefined") { height = 20; }
        var x;
        var y;
        var isDone;
        while (true) {
            isDone = true;
            x = Math.floor(Math.random() * width);
            y = Math.floor(Math.random() * height);
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

    function getSurroundingPoints(p) {
        var sp = [];
        sp.push(newPoint(p.x - 1, p.y + 1));
        sp.push(newPoint(p.x, p.y + 1));
        sp.push(newPoint(p.x + 1, p.y + 1));
        sp.push(newPoint(p.x - 1, p.y));
        sp.push(newPoint(p.x, p.y));
        sp.push(newPoint(p.x + 1, p.y));
        sp.push(newPoint(p.x - 1, p.y - 1));
        sp.push(newPoint(p.x, p.y - 1));
        sp.push(newPoint(p.x + 1, p.y - 1));
        return sp;
    }

    function pointToString(p) {
        return Math.floor(p.x) + "," + Math.floor(p.y);
    }

    function isInBound(pos, width, height, margin) {
        if (typeof width === "undefined") { width = WIDTH; }
        if (typeof height === "undefined") { height = HEIGHT; }
        if (typeof margin === "undefined") { margin = 3; }
        return (-margin <= pos.x && pos.x < width + margin) && (-margin <= pos.y && pos.y < height + margin);
    }

    function mapToCollision(p) {
        return { x: Math.floor(p.x * 1.0 * GRID_WIDTH / WIDTH), y: Math.floor(p.y * 1.0 * GRID_HEIGHT / HEIGHT) };
    }

    function collisionToMap(p) {
        return { x: p.x * WIDTH / GRID_WIDTH, y: p.y * HEIGHT / GRID_HEIGHT };
    }

    function move(player, dt) {
        var distance = SPEED * dt;
        var pos = player.curPos;
        var dir = player.dir;
        player.dir.applyAxisAngle(Z_AXIS, player.curTheta);
        return { x: pos.x + distance * dir.x, y: pos.y + distance * dir.y };
    }

    var tolerance = Util.degreeToRadian(0.5) / TIMESTEP;

    function updateDir(player, dt) {
        var intendedTurn = MAX_THETA * Math.tan(player.normalizedTheta);
        var delta = intendedTurn - player.curTheta;
        if (Math.abs(delta) > tolerance) {
            var direction = (delta >= 0) ? 1 : -1;
            delta = Math.abs(delta);
            delta = direction * Math.min(delta, DELTA_THETA * dt);
            player.curTheta += delta;
        }
    }

    function getLine(curPos, newPos) {
        var x0 = Math.floor(curPos.x);
        var y0 = Math.floor(curPos.y);
        var x1 = Math.floor(newPos.x);
        var y1 = Math.floor(newPos.y);

        var xo = x0;
        var yo = y0;

        var steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
        var tmp;
        if (steep) {
            tmp = x0;
            x0 = y0;
            y0 = tmp;
            tmp = x1;
            x1 = y1;
            y1 = tmp;
        }
        if (x0 > x1) {
            tmp = x0;
            x0 = x1;
            x1 = tmp;
            tmp = y0;
            y0 = y1;
            y1 = tmp;
        }

        var dx = x1 - x0;
        var dy = Math.abs(y1 - y0);
        var error = dx / 2;

        var sy = (y0 < y1) ? 1 : -1;

        var y = y0;

        var xa;
        var ya;
        var res = new Array();
        for (var x = x0; x <= x1; x++) {
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
})(Engine || (Engine = {}));
var Graphics;
(function (Graphics) {
    function v3(x, y, z) {
        return new THREE.Vector3(x, y, z);
    }

    var PLAYER_COLOR = 0xFF00FF;
    var CAMERA_HEIGHT = 25;
    var CAMERA_FOV = 75;
    var HOVER_HEIGHT = 4;
    var PLAYER_HEIGHT = 6;
    var OBSTACLE_HEIGHT = 18;
    var GOAL_HEIGHT = 75;

    var Engine = (function () {
        function Engine(state, gameCanvas) {
            this.state = state;
            this.initializeScene();
            this.initializeCamera(gameCanvas.width / gameCanvas.height);
            this.initializeRenderer(gameCanvas);
        }
        Engine.prototype.initializeScene = function () {
            this.scene = new THREE.Scene();
            this.initializeMap();
            this.initializeObstacles();
            this.initializeGoal();
            this.initializePlayer();
        };

        Engine.prototype.initializeMap = function () {
            var geometry = new THREE.Geometry();
            var mapGridWidth = Data.WIDTH / Data.GRID_WIDTH;
            var mapGridDepth = Data.HEIGHT / Data.GRID_HEIGHT;
            for (var i = 0; i <= Data.WIDTH; i += mapGridWidth) {
                geometry.vertices.push(v3(i, 0, 0));
                geometry.vertices.push(v3(i, Data.HEIGHT, 0));
            }

            for (var j = 0; j <= Data.HEIGHT; j += mapGridDepth) {
                geometry.vertices.push(v3(0, j, 0));
                geometry.vertices.push(v3(Data.WIDTH, j, 0));
            }

            var material = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
            var grid = new THREE.Line(geometry, material, THREE.LinePieces);
            this.scene.add(grid);
        };

        Engine.prototype.initializeObstacles = function () {
            var obstacleWidth = Data.WIDTH / Data.GRID_WIDTH;
            var obstacleDepth = Data.HEIGHT / Data.GRID_HEIGHT;

            var geometry = new THREE.BoxGeometry(obstacleWidth, obstacleDepth, OBSTACLE_HEIGHT);

            var hiddenMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                shading: THREE.FlatShading
            });

            this.obstacles = new Array();
            this.hiddenObstacles = new Array();
            for (var i = 0; i < this.state.obstacles.length; i++) {
                var obstaclePos = this.state.obstacles[i].pos;

                var wireframeMaterial = new THREE.MeshBasicMaterial({
                    color: this.state.obstacles[i].color,
                    shading: THREE.FlatShading,
                    wireframe: true,
                    wireframeLinewidth: 2
                });

                var obstacle = new THREE.Mesh(geometry, wireframeMaterial);
                obstacle.position.x = obstaclePos.x + obstacleWidth / 2;
                obstacle.position.y = obstaclePos.y + obstacleWidth / 2;
                obstacle.position.z = obstaclePos.z + OBSTACLE_HEIGHT / 2;
                this.scene.add(obstacle);

                var hiddenObstacle = new THREE.Mesh(geometry, hiddenMaterial);
                hiddenObstacle.position.x = obstaclePos.x + obstacleWidth / 2;
                hiddenObstacle.position.y = obstaclePos.y + obstacleWidth / 2;
                hiddenObstacle.position.z = obstaclePos.z + OBSTACLE_HEIGHT / 2;
                this.scene.add(hiddenObstacle);

                this.obstacles.push(obstacle);
                this.hiddenObstacles.push(hiddenObstacle);
            }
        };

        Engine.prototype.initializeGoal = function () {
            var goalWidth = Data.WIDTH / Data.GRID_WIDTH;
            var goalDepth = Data.HEIGHT / Data.GRID_HEIGHT;

            var goalX = this.state.goal.pos.x;
            var goalY = this.state.goal.pos.y;

            this.initializeGoalSquare(goalWidth, goalDepth, goalX, goalY);
            this.initializeGoalObject(goalWidth, goalDepth, goalX, goalY);
        };

        Engine.prototype.initializeGoalSquare = function (goalWidth, goalDepth, goalX, goalY) {
            var geometry = new THREE.Geometry();
            geometry.vertices.push(v3(goalX, goalY, 0));
            geometry.vertices.push(v3(goalX + goalWidth, goalY, 0));
            geometry.vertices.push(v3(goalX + goalWidth, goalY + goalDepth, 0));
            geometry.vertices.push(v3(goalX, goalY + goalDepth, 0));
            geometry.faces.push(new THREE.Face3(0, 1, 2));
            geometry.faces.push(new THREE.Face3(0, 2, 3));
            var material = new THREE.MeshBasicMaterial({
                color: 0x0000FF,
                shading: THREE.FlatShading
            });
            material.opacity = 0.5;
            material.transparent = true;
            var goalSquare = new THREE.Mesh(geometry, material);
            this.scene.add(goalSquare);
        };

        Engine.prototype.initializeGoalObject = function (goalWidth, goalDepth, goalX, goalY) {
            var geometry = new THREE.Geometry();
            geometry.vertices.push(v3(goalX, goalY, 0));
            geometry.vertices.push(v3(goalX + goalWidth, goalY, 0));
            geometry.vertices.push(v3(goalX + goalWidth, goalY + goalDepth, 0));
            geometry.vertices.push(v3(goalX, goalY + goalDepth, 0));
            geometry.vertices.push(v3(goalX + goalWidth / 2, goalY + goalDepth / 2, GOAL_HEIGHT));

            geometry.faces.push(new THREE.Face3(0, 1, 2));
            geometry.faces.push(new THREE.Face3(0, 2, 3));
            geometry.faces.push(new THREE.Face3(0, 1, 4));
            geometry.faces.push(new THREE.Face3(1, 2, 4));
            geometry.faces.push(new THREE.Face3(2, 3, 4));
            geometry.faces.push(new THREE.Face3(3, 0, 4));

            var wireframeMaterial = new THREE.MeshBasicMaterial({
                color: 0x00FF00,
                shading: THREE.FlatShading,
                wireframe: true,
                wireframeLinewidth: 4
            });
            var hiddenMaterial = new THREE.MeshBasicMaterial({
                color: 0x007700,
                shading: THREE.FlatShading
            });

            this.goal = new THREE.Mesh(geometry, wireframeMaterial);
            this.scene.add(this.goal);

            this.hiddenGoal = new THREE.Mesh(geometry, hiddenMaterial);
            this.scene.add(this.hiddenGoal);
        };

        Engine.prototype.initializePlayer = function () {
            var geometry = new THREE.Geometry();
            var dx = Data.PLAYER_WIDTH / 2;
            var dy = Data.PLAYER_LENGTH;

            geometry.vertices.push(v3(0, 0, 0));
            geometry.vertices.push(v3(dx, 0, -dy));
            geometry.vertices.push(v3(-dx, 0, -dy));
            geometry.vertices.push(v3(-dx, -PLAYER_HEIGHT, -dy + 1));
            geometry.vertices.push(v3(dx, -PLAYER_HEIGHT, -dy + 2));

            geometry.faces.push(new THREE.Face3(0, 1, 2));

            geometry.faces.push(new THREE.Face3(0, 4, 1));

            geometry.faces.push(new THREE.Face3(0, 2, 3));

            geometry.faces.push(new THREE.Face3(4, 3, 2));
            geometry.faces.push(new THREE.Face3(4, 2, 1));

            var wireframeMaterial = new THREE.MeshBasicMaterial({
                color: PLAYER_COLOR,
                shading: THREE.FlatShading,
                wireframe: true,
                wireframeLinewidth: 3
            });

            var hiddenMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                shading: THREE.FlatShading
            });

            this.player = new THREE.Mesh(geometry.clone(), wireframeMaterial);
            this.player.position.z = HOVER_HEIGHT + PLAYER_HEIGHT;
            this.player.up.set(0, 0, 1);
            this.scene.add(this.player);

            this.hiddenPlayer = new THREE.Mesh(geometry.clone(), hiddenMaterial);
            this.hiddenPlayer.position.z = HOVER_HEIGHT + PLAYER_HEIGHT;
            this.hiddenPlayer.up.set(0, 0, 1);
            this.scene.add(this.hiddenPlayer);
        };

        Engine.prototype.initializeCamera = function (aspectRatio) {
            this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspectRatio, 0.1, 10000);
            this.camera.position.z = CAMERA_HEIGHT;
            this.camera.up.set(0, 0, 1);
        };

        Engine.prototype.initializeRenderer = function (canvas) {
            this.renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                antialias: true,
                precision: "highp"
            });
            console.log("Initialized renderer.");
            this.renderer.setClearColor("black");
        };

        Engine.prototype.render = function () {
            this.setupCamera();
            this.setupPlayer();
            this.setupObstacles();

            this.renderer.render(this.scene, this.camera);
        };

        Engine.prototype.goalReached = function (nextLevel) {
            nextLevel();
            this.initializeScene();
        };

        Engine.prototype.gameOver = function (restartGame) {
            restartGame();
            this.initializeScene();
        };

        Engine.prototype.setupPlayer = function () {
            var nextState = this.state.player;

            var pos = nextState.curPos;
            var dir = nextState.dir;
            var theta = nextState.normalizedTheta;

            this.player.position.x = pos.x;
            this.player.position.y = pos.y;
            this.hiddenPlayer.position.x = pos.x;
            this.hiddenPlayer.position.y = pos.y;

            var up = v3(0, 0, 1).applyAxisAngle(dir, -theta * Math.PI / 4);
            this.player.up.set(up.x, up.y, up.z);
            this.hiddenPlayer.up.set(up.x, up.y, up.z);

            this.player.lookAt(v3(pos.x + dir.x * 50, pos.y + dir.y * 50, PLAYER_HEIGHT + HOVER_HEIGHT - 8));
            this.hiddenPlayer.lookAt(v3(pos.x + dir.x * 50, pos.y + dir.y * 50, PLAYER_HEIGHT + HOVER_HEIGHT - 8));
        };

        Engine.prototype.setupObstacles = function () {
            var obstacleWidth = Data.WIDTH / Data.GRID_WIDTH;
            var obstacleDepth = Data.HEIGHT / Data.GRID_HEIGHT;

            for (var i = 0; i < this.obstacles.length; i++) {
                var obstacle = this.obstacles[i];
                var hiddenObstacle = this.hiddenObstacles[i];
                var obstaclePos = this.state.obstacles[i].pos;

                obstacle.position.x = obstaclePos.x + obstacleWidth / 2;
                obstacle.position.y = obstaclePos.y + obstacleWidth / 2;
                obstacle.position.z = obstaclePos.z + OBSTACLE_HEIGHT / 2;

                hiddenObstacle.position.x = obstaclePos.x + obstacleWidth / 2;
                hiddenObstacle.position.y = obstaclePos.y + obstacleWidth / 2;
                hiddenObstacle.position.z = obstaclePos.z + OBSTACLE_HEIGHT / 2;
            }
        };

        Engine.prototype.setupCamera = function () {
            var pos = this.state.player.curPos;
            var dir = this.state.player.dir;

            this.camera.position.x = pos.x - dir.x * 50;
            this.camera.position.y = pos.y - dir.y * 50;

            this.camera.lookAt(v3(pos.x + dir.x * 50, pos.y + dir.y * 50, 0));
            this.camera.updateProjectionMatrix();
        };
        return Engine;
    })();
    Graphics.Engine = Engine;
})(Graphics || (Graphics = {}));
var Coordinator;
(function (Coordinator) {
    function create(cameraVideoId, setupCanvasId, leftCanvasId, centerCanvasId, rightCanvasId) {
        var cameraVideo = null;
        var leftCanvas = null;
        var rightCanvas = null;
        var centerCanvas = null;
        var setupCanvas = null;
        var camera = null;
        var smallScreenWidth = 250;
        var smallScreenHeight = 190;
        var largeScreenWidth = 800;
        var largeScreenHeight = 600;
        var skinCaptureRegionLeft;
        var skinCaptureRegionTop;
        var skinCaptureRegionWidth;
        var skinCaptureRegionHeight;
        var didCaptureSkinColor = false;
        var cameraOverlayFontSize = 16;
        var cameraCountdownFontSize = 24;
        var cameraPermissionReloadHash = "#camera_permission_denied";

        cameraVideo = Util.findFirstElementFromId(cameraVideoId);
        if (cameraVideo == null)
            return { error: "Setup failed: could not find the camera's video element \"" + cameraVideoId + "\"" };

        setupCanvas = Util.findFirstElementFromId(setupCanvasId);
        if (setupCanvas == null)
            return { error: "Setup failed: could not find the setup canvas \"" + setupCanvasId + "\"" };

        leftCanvas = Util.findFirstElementFromId(leftCanvasId);
        if (leftCanvas == null)
            return { error: "Setup failed: could not find the camera canvas \"" + leftCanvasId + "\"" };

        rightCanvas = Util.findFirstElementFromId(rightCanvasId);
        if (rightCanvas == null)
            return { error: "Setup failed: could not find the debug canvas \"" + rightCanvasId + "\"" };

        centerCanvas = Util.findFirstElementFromId(centerCanvasId);
        if (centerCanvas == null)
            return { error: "Setup failed: could not find the game canvas \"" + centerCanvasId + "\"" };

        camera = new Util.Camera(cameraVideo, setupCanvas, function (e) {
            console.log("Error: Failed to initialize camera with error:" + e.name);
            if (location.href.match(cameraPermissionReloadHash) == null) {
                location.href += cameraPermissionReloadHash;
                location.reload();
            }
        });

        var setSmallScreenDimensions = function (width, height) {
            smallScreenWidth = width;
            smallScreenHeight = height;
        };

        var setLargeScreenDimensions = function (width, height) {
            largeScreenWidth = width;
            largeScreenHeight = height;
        };

        var setSkinCaptureRegion = function (left, top, width, height) {
            skinCaptureRegionLeft = left;
            skinCaptureRegionTop = top;
            skinCaptureRegionWidth = width;
            skinCaptureRegionHeight = height;
            camera.setRenderCameraOverlay(function (context) {
                renderCameraOverlay(context);
                context.save();
                context.fillStyle = "#FF0000";
                context.font = cameraOverlayFontSize + "px Open Sans";
                context.fillText("Press any key to begin capture.", skinCaptureRegionLeft, skinCaptureRegionTop + skinCaptureRegionHeight + cameraOverlayFontSize + 4);
                context.restore();
            });
        };

        var renderCameraOverlay = function (context) {
            context.beginPath();
            context.save();
            context.strokeStyle = "#FF0000";
            context.lineWidth = 3;
            context.moveTo(skinCaptureRegionLeft - 2, skinCaptureRegionTop - 2);
            context.lineTo(skinCaptureRegionLeft + skinCaptureRegionWidth + 2, skinCaptureRegionTop - 2);
            context.lineTo(skinCaptureRegionLeft + skinCaptureRegionWidth + 2, skinCaptureRegionTop + skinCaptureRegionHeight + 2);
            context.lineTo(skinCaptureRegionLeft - 2, skinCaptureRegionTop + skinCaptureRegionHeight + 2);
            context.lineTo(skinCaptureRegionLeft - 2, skinCaptureRegionTop - 2);
            context.stroke();
            context.restore();
        };

        var captureSkinColorAfterDelay = function (captureDelay) {
            var captureStartTime = new Date().getTime();
            camera.setRenderCameraOverlay(function (context) {
                var currentTime = new Date().getTime();
                var timeInMSSinceCaptureBegan = currentTime - captureStartTime;
                if (timeInMSSinceCaptureBegan <= captureDelay) {
                    renderCameraOverlay(context);
                    context.save();
                    context.fillStyle = "#FF0000";
                    context.font = cameraCountdownFontSize + "px Open Sans";
                    context.fillText(String(Math.round((captureDelay - timeInMSSinceCaptureBegan) / 1000)), skinCaptureRegionLeft + skinCaptureRegionWidth, skinCaptureRegionTop + skinCaptureRegionHeight + cameraCountdownFontSize + 4);
                    context.restore();
                } else
                    camera.setRenderCameraOverlay(null);
            });
            setTimeout(function () {
                var rgbData = new Util.RGBData(largeScreenWidth, largeScreenHeight);
                rgbData.setFrame(camera.getFrame());
                var skinColor = Setup.getAverageColor(rgbData, skinCaptureRegionLeft, skinCaptureRegionTop, skinCaptureRegionWidth, skinCaptureRegionHeight);
                didCaptureSkinColor = true;

                $(setupCanvas).hide();
                $(centerCanvas).show();
                centerCanvas.width = largeScreenWidth;
                centerCanvas.height = largeScreenHeight;
                camera.cropResize(smallScreenWidth, smallScreenHeight);
                camera.setDisplayCanvas(leftCanvas);
                Steering.setDisplayCanvas(rightCanvas);
                Steering.setup(camera, skinColor);
                Steering.start(10);
                Engine.initialize(centerCanvas);
                Engine.start();
            }, captureDelay);
        };

        var initializeSteeringAndGame = function () {
            if (!camera.ready())
                setTimeout(initializeSteeringAndGame, 500);
            else {
                camera.cropResize(largeScreenWidth, largeScreenHeight);
                camera.start();
            }
        };

        var getSteeringAngle = function () {
            return Steering.theta();
        };

        return {
            setSmallScreenDimensions: setSmallScreenDimensions,
            setLargeScreenDimensions: setLargeScreenDimensions,
            setSkinCaptureRegion: setSkinCaptureRegion,
            initialize: initializeSteeringAndGame,
            getSteeringAngle: getSteeringAngle,
            captureSkinColorAfterDelay: captureSkinColorAfterDelay
        };
    }
    Coordinator.create = create;
})(Coordinator || (Coordinator = {}));
