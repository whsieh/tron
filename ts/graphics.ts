/// <reference path="./references.ts" />
module Graphics {
    import GameState = Data.GameState;

    // Helper methods

    function v3(x, y, z) {
        return new THREE.Vector3(x, y, z)
    }

    // Constants

    var COLORS: number[] = [
        0xFF00FF,
        0x800000,
        0x800080,
        0xFF0000,
        0x0000FF,
        0x808000,
        0x008000,
        0xFFFF00,
    ];
    var HOVER_HEIGHT: number = 4;
    var PLAYER_HEIGHT: number = 6;

    // Interface

    export class Engine {
        // Engine state
        private state: GameState;
        private scene: any;
        private renderer: any;
        private camera: any;

        // Render state
        private map: any;
        private players: Array<any> = [];
        private trails: Array<any> = [];

        constructor(state: GameState, gameCanvas: HTMLCanvasElement) {
            if (state.numPlayers > 8) {
                throw new Error("Cannot support more than 8 players");
            }

            var screenWidth = gameCanvas.width;
            var screenHeight = gameCanvas.height;
            this.state = state;
            // Setup Scene and Canvas Element
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, screenWidth / screenHeight, 0.1, 1000);
            this.camera.position.z = 25;
            this.camera.up.set(0, 0, 1);
            this.renderer = new THREE.CanvasRenderer({canvas: gameCanvas});
            this.renderer.setSize(screenWidth, screenHeight);
            // Callbacks
            $(window).resize(function() {
                if (this.renderer != null && this.camera != null) {
                    this.renderer.setSize(screenWidth, screenHeight);
                    this.camera.aspect = screenWidth / screenHeight;
                    this.camera.updateProjectionMatrix();
                }
            });

            // Initialize Map and Players
            this.initializeMap();
            this.initializePlayers();
        }

        render(): void {
            // Restart scene with map
            this.scene.add(this.map);
            // Place camera properly
            this.setCamera();
            // Render players and trails
            this.renderPlayers();
            // this.renderTrails();
            // Render the result

            this.renderer.render(this.scene, this.camera);
        }

        gameOver(): void {
            alert("Game Over");
        }

        private initializeMap(): void {
            var material = new THREE.LineBasicMaterial({color: 0xffffff});
            var geometry = new THREE.Geometry();
            for (var i = 0; i <= Data.WIDTH; i += 50) {
                geometry.vertices.push(v3(i, 0, 0));
                geometry.vertices.push(v3(i, Data.HEIGHT, 0));
            }

            for (var j = 0; j <= Data.HEIGHT; j+= 50) {
                geometry.vertices.push(v3(0, j, 0));
                geometry.vertices.push(v3(Data.WIDTH, j, 0));
            }

            this.map = new THREE.Line(geometry, material, THREE.LinePieces);
            this.scene.add(this.map);
        }

        private initializePlayers(): void {
            var geometry, material;

            geometry = new THREE.Geometry();
            geometry.vertices.push(v3(0, 0, 0));
            geometry.vertices.push(v3(6, 0, -20.9));
            geometry.vertices.push(v3(-6, 0, -20.9));
            geometry.vertices.push(v3(-6, -PLAYER_HEIGHT, -20));
            geometry.vertices.push(v3(6, -PLAYER_HEIGHT, -20));

            geometry.faces.push(new THREE.Face3(0, 1, 2));
            geometry.faces.push(new THREE.Face3(0, 4, 1));
            geometry.faces.push(new THREE.Face3(0, 2, 3));
            geometry.faces.push(new THREE.Face3(4, 3, 2));
            geometry.faces.push(new THREE.Face3(4, 2, 1));

            for (var i = 0; i < this.state.players.length; i++) {
                material = new THREE.MeshBasicMaterial({
                    color: COLORS[i],
                    wireframe: true,
                    wireframeLinewidth: 3
                });

                this.players[i] = new THREE.Mesh(geometry, material);
                this.players[i].position.z = HOVER_HEIGHT + PLAYER_HEIGHT;
                this.players[i].up.set(0, 0, 1);

                this.scene.add(this.players[i]);
            }
        }

        private renderPlayers() : void {
            var player, pos, dir, up, normalizedTheta;

            for (var i = 0; i < this.state.players.length; i++) {
                player = this.state.players[i];
                if (!player.isDead) {

                    // If player still alive, render!
                    pos = player.curPos;
                    dir = player.dir;

                    normalizedTheta = player.normalizedTheta;

                    // Place player in the right position
                    this.players[i].position.x = pos.x;
                    this.players[i].position.y = pos.y;

                    // Tilt
                    up = v3(0, 0, 1).applyAxisAngle(dir, -normalizedTheta * Math.PI / 4)
                    this.players[i].up.set(up.x, up.y, up.z);


                    // Point player in the right direction
                    this.players[i].lookAt(v3(pos.x + dir.x * 50, pos.y + dir.y * 50,
                        PLAYER_HEIGHT + HOVER_HEIGHT - 8));
                }
            }
        }

        private renderTrails(): void {
            var geometry, material, trail, trailPoint;
            for (var i = 0; i < this.state.players.length; i++) {
                geometry = new THREE.Geometry();
                material = new THREE.LineBasicMaterial({color: COLORS[i]});
                // Add every trail
                for (var c = 0; c < this.state.players[i].trail.length; c++) {
                    trailPoint = this.state.players[i].trail[c];

                    geometry.vertices.push(v3(trailPoint.x, trailPoint.y, HOVER_HEIGHT));
                    geometry.vertices.push(v3(trailPoint.x, trailPoint.y,
                        PLAYER_HEIGHT + HOVER_HEIGHT));
                }

                this.scene.add(new THREE.Line(geometry, material, THREE.LinePieces));
            }
        }

        private setCamera(): void {
            var pos = this.state.players[0].curPos;
            var dir = this.state.players[0].dir;

            // Magic number for camera setting.
            this.camera.position.x = pos.x - dir.x * 50;
            this.camera.position.y = pos.y - dir.y * 50;

            this.camera.lookAt(v3(pos.x + dir.x * 50, pos.y + dir.y * 50, 0));
            this.camera.updateProjectionMatrix();
        }
    }
}
