/// <reference path="./references.ts" />

module Coordinator {

    var cameraVideo: HTMLVideoElement = null;
    var leftCanvas: HTMLCanvasElement = null;
    var rightCanvas: HTMLCanvasElement = null;
    var centerCanvas: HTMLCanvasElement = null;
    var setupCanvas: HTMLCanvasElement = null;
    var camera: Util.Camera = null;
    var cameraWidth: number = 250;
    var cameraHeight: number = 190;
    var gameRendererWidth: number = 800;
    var gameRendererHeight: number = 600;

    export function create(cameraVideoId: String, setupCanvasId: String, leftCanvasId: String, centerCanvasId: String, rightCanvasId: String): any {

        cameraVideo = <HTMLVideoElement> Util.findFirstElementFromId(cameraVideoId);
        if (cameraVideo == null)
            return { error: "Setup failed: could not find the camera's video element \"" + cameraVideoId + "\"" }

        setupCanvas = <HTMLCanvasElement> Util.findFirstElementFromId(setupCanvasId);
        if (setupCanvas == null)
            return { error: "Setup failed: could not find the setup canvas \"" + setupCanvasId + "\"" }

        leftCanvas = <HTMLCanvasElement> Util.findFirstElementFromId(leftCanvasId);
        if (leftCanvas == null)
            return { error: "Setup failed: could not find the camera canvas \"" + leftCanvasId + "\"" }

        rightCanvas = <HTMLCanvasElement> Util.findFirstElementFromId(rightCanvasId);
        if (rightCanvas == null)
            return { error: "Setup failed: could not find the debug canvas \"" + rightCanvasId + "\"" }

        centerCanvas = <HTMLCanvasElement> Util.findFirstElementFromId(centerCanvasId);
        if (centerCanvas == null)
            return { error: "Setup failed: could not find the game canvas \"" + centerCanvasId + "\"" }

        camera = new Util.Camera(cameraVideo, setupCanvas, function(e) {
            console.log("Error: Failed to initialize camera with error:" + e.name);
        });

        var setCameraDimensions = function(width: number, height: number) {
            cameraWidth = width;
            cameraHeight = height;
        }

        var setGameRendererDimensions = function(width: number, height: number) {
            gameRendererWidth = width;
            gameRendererHeight = height;
        }

        var initializeSteeringAndGame = function() {
            if (!camera.ready()) {
                setTimeout(initializeSteeringAndGame, 1000);
                return;
            }
            camera.cropResize(cameraWidth, cameraHeight);
            camera.start();

            console.log("Preparing to capture skin color...");
            setTimeout(function() {
                var rgbData = new Util.RGBData(cameraWidth, cameraHeight);
                rgbData.setFrame(camera.getFrame());
                var skinColor = Setup.getAverageColor(rgbData, Math.round(cameraWidth / 3), Math.round(cameraHeight / 3), Math.round(cameraWidth / 3), Math.round(cameraHeight / 3));

                centerCanvas.width = gameRendererWidth;
                centerCanvas.height = gameRendererHeight;
                $(setupCanvas).hide();
                $(centerCanvas).show();
                camera.setDisplayCanvas(leftCanvas);
                Steering.setDisplayCanvas(rightCanvas);
                Steering.setup(camera, skinColor);
                Steering.start(10);
                Engine.initialize(centerCanvas);
                Engine.step(0);
            }, 1000);
        }

        var getSteeringAngle = function() {
            return Steering.theta();
        }

        return {
            setCameraDimensions: setCameraDimensions,
            setGameRendererDimensions: setGameRendererDimensions,
            initialize: initializeSteeringAndGame,
            getSteeringAngle: getSteeringAngle
        }
    }
}
