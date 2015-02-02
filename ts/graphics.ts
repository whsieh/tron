/// <reference path="./references.ts" />
module Graphics {
    import GameState = Data.GameState;

    // Helper methods

    function v3(x, y, z) {
        return new THREE.Vector3(x, y, z)
    }

    // Constants
    var PLAYER_COLOR: number = 0xFF00FF;
    var CAMERA_HEIGHT: number = 25;
    var CAMERA_FOV: number = 75;
    var HOVER_HEIGHT: number = 4;
    var PLAYER_HEIGHT: number = 6;
    var OBSTACLE_HEIGHT: number = 25;

    export class Engine {
        // Engine state
        private state: GameState;
        private scene: any;
        private renderer: any;
        private camera: any;

        // Render state
        private player: any;
        private hiddenPlayer: any;

        constructor(state: GameState, gameCanvas: HTMLCanvasElement) {
            this.state = state;
            this.initializeScene();
            console.log([gameCanvas.width, gameCanvas.height]);
            console.log(gameCanvas);
            this.initializeCamera(gameCanvas.width / gameCanvas.height);
            this.initializeRenderer(gameCanvas);
        }

        private initializeScene(): void {
            this.scene = new THREE.Scene();
            this.initializeMap();
            this.initializeObstacles();
            this.initializeGoal();
            this.initializePlayer();
        }

        private initializeMap(): void {
            // Creates a Data.WIDTH x Data.HEIGHT white grid and adds it to the scene
            var geometry = new THREE.Geometry();
            var mapGridWidth = Data.WIDTH / Data.GRID_WIDTH;
            var mapGridDepth = Data.HEIGHT / Data.GRID_HEIGHT;
            for (var i = 0; i <= Data.WIDTH; i += mapGridWidth) {
                geometry.vertices.push(v3(i, 0, 0));
                geometry.vertices.push(v3(i, Data.HEIGHT, 0));
            }

            for (var j = 0; j <= Data.HEIGHT; j+= mapGridDepth) {
                geometry.vertices.push(v3(0, j, 0));
                geometry.vertices.push(v3(Data.WIDTH, j, 0));
            }

            var material = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
            var grid = new THREE.Line(geometry, material, THREE.LinePieces);
            this.scene.add(grid);
        }

        private initializeObstacles(): void {
            var obstacleWidth = Data.WIDTH / Data.GRID_WIDTH;
            var obstacleDepth = Data.HEIGHT / Data.GRID_HEIGHT;

            var geometry = new THREE.BoxGeometry(obstacleWidth, obstacleDepth, OBSTACLE_HEIGHT);

            var wireframeMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xFF0000,
                shading: THREE.FlatShading,
                wireframe: true,
                wireframeLinewidth: 2
            });
            var hiddenMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x000000,
                shading: THREE.FlatShading,
            });

            for (var i = 0; i < this.state.obstacles.length; i++) {
                var obstaclePos  = this.state.obstacles[i].pos;

                var obstacle = new THREE.Mesh(geometry, wireframeMaterial);
                obstacle.position.x = obstaclePos.x + obstacleWidth / 2;
                obstacle.position.y = obstaclePos.y + obstacleWidth / 2;
                obstacle.position.z = OBSTACLE_HEIGHT / 2;
                this.scene.add(obstacle);                

                var hiddenObstacle = new THREE.Mesh(geometry, hiddenMaterial)
                hiddenObstacle.position.x = obstaclePos.x + obstacleWidth / 2;
                hiddenObstacle.position.y = obstaclePos.y + obstacleWidth / 2;
                hiddenObstacle.position.z = OBSTACLE_HEIGHT / 2;
                this.scene.add(hiddenObstacle)
            }
        }

        private initializeGoal(): void {

        }

        private initializePlayer(): void {
            var geometry = new THREE.Geometry();
            var dx = Data.PLAYER_WIDTH / 2
            var dy = Data.PLAYER_LENGTH

            geometry.vertices.push(v3(0, 0, 0));
            geometry.vertices.push(v3(dx, 0, -dy));
            geometry.vertices.push(v3(-dx, 0, -dy));
            geometry.vertices.push(v3(-dx, -PLAYER_HEIGHT, -dy + 1));
            geometry.vertices.push(v3(dx, -PLAYER_HEIGHT, -dy + 2));

            // Top face
            geometry.faces.push(new THREE.Face3(0, 1, 2));
            // Left face
            geometry.faces.push(new THREE.Face3(0, 4, 1));
            // Right face
            geometry.faces.push(new THREE.Face3(0, 2, 3));
            // Back face
            geometry.faces.push(new THREE.Face3(4, 3, 2));
            geometry.faces.push(new THREE.Face3(4, 2, 1));

            var wireframeMaterial = new THREE.MeshBasicMaterial({
                color: PLAYER_COLOR,
                shading: THREE.FlatShading,
                wireframe: true,
                wireframeLinewidth: 3
            });

            var hiddenObjectMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                shading: THREE.FlatShading
            });

            this.player = new THREE.Mesh(geometry.clone(), wireframeMaterial);
            this.player.position.z = HOVER_HEIGHT + PLAYER_HEIGHT;
            this.player.up.set(0, 0, 1);
            this.scene.add(this.player);

            this.hiddenPlayer = new THREE.Mesh(geometry.clone(), hiddenObjectMaterial);
            this.hiddenPlayer.position.z = HOVER_HEIGHT + PLAYER_HEIGHT;
            this.hiddenPlayer.up.set(0, 0, 1);
            this.scene.add(this.hiddenPlayer);
        }

        private initializeCamera(aspectRatio: number): void {
            this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspectRatio, 0.1, 1000);
            this.camera.position.z = CAMERA_HEIGHT;
            this.camera.up.set(0, 0, 1);
        }

        private initializeRenderer(canvas: HTMLCanvasElement): void {
            this.renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                antialias: true,
                precision: "highp"
            });
            console.log("Initialized renderer.");
            this.renderer.setClearColor("black");
        }

        public render(): void {
            this.setupCamera();
            this.setupPlayer();

            this.renderer.render(this.scene, this.camera);
        }

        public goalReached(nextLevel:()=>void): void {
            nextLevel()
        }

        public gameOver(restartGame:()=>void): void {
            restartGame()
        }

        private setupPlayer() : void {
            var nextState = this.state.player;

            // Updated values
            var pos = nextState.curPos;
            var dir = nextState.dir;
            var theta = nextState.normalizedTheta;

            // Place player in the right position
            this.player.position.x = pos.x;
            this.player.position.y = pos.y;
            this.hiddenPlayer.position.x = pos.x;
            this.hiddenPlayer.position.y = pos.y;

            // Tilt
            var up = v3(0, 0, 1).applyAxisAngle(dir, -theta * Math.PI / 4);
            this.player.up.set(up.x, up.y, up.z);
            this.hiddenPlayer.up.set(up.x, up.y, up.z);

            // Point player in the right direction
            this.player.lookAt(v3(
                pos.x + dir.x * 50,
                pos.y + dir.y * 50,
                PLAYER_HEIGHT + HOVER_HEIGHT - 8
                )
            );
            this.hiddenPlayer.lookAt(v3(
                pos.x + dir.x * 50,
                pos.y + dir.y * 50,
                PLAYER_HEIGHT + HOVER_HEIGHT - 8
                )
            );
        }

        private setupCamera(): void {
            var pos = this.state.player.curPos;
            var dir = this.state.player.dir;

            // Magic number for camera setting.
            this.camera.position.x = pos.x - dir.x * 50;
            this.camera.position.y = pos.y - dir.y * 50;

            this.camera.lookAt(v3(pos.x + dir.x * 50, pos.y + dir.y * 50, 0));
            this.camera.updateProjectionMatrix();
        }
    }
}
