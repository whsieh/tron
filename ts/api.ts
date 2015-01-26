/// <reference path="./references.ts" />

module Coordinator {

    export function create(cameraVideoId: String, cameraCanvasId: String, debugCanvasId: String, gameCanvasId: String): any {
        var cameraVideo: HTMLVideoElement = null;
        var cameraCanvas: HTMLCanvasElement = null;
        var debugCanvas: HTMLCanvasElement = null;
        var gameCanvas: HTMLCanvasElement = null;
        var camera: Util.Camera = null;
        var cameraWidth: number = 250;
        var cameraHeight: number = 190;

        cameraVideo = <HTMLVideoElement> Util.findFirstElementFromId(cameraVideoId);
        if (cameraVideo == null)
            return { error: "Setup failed: could not find camera's video element \"" + cameraVideoId + "\"" }

        cameraCanvas = <HTMLCanvasElement> Util.findFirstElementFromId(cameraCanvasId);
        if (cameraCanvas == null)
            return { error: "Setup failed: could not find camera's canvas element \"" + cameraCanvasId + "\"" }

        debugCanvas = <HTMLCanvasElement> Util.findFirstElementFromId(debugCanvasId);
        if (debugCanvas == null)
            return { error: "Setup failed: could not find debug canvas \"" + debugCanvasId + "\"" }

        gameCanvas = <HTMLCanvasElement> Util.findFirstElementFromId(gameCanvasId);
        if (gameCanvas == null)
            return { error: "Setup failed: could not find game canvas \"" + gameCanvasId + "\"" }

        camera = new Util.Camera(cameraVideo, cameraCanvas, function(e) {
            console.log("Error: Failed to initialize camera with error:" + e.name);
        });
        
        var setCameraDimensions = function(width: number, height: number) {
            cameraWidth = width;
            cameraHeight = height;
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

                console.log("    Skin color: [r=" + skinColor.r + ", g=" + skinColor.g + ", b=" + skinColor.b + "]");
                Steering.setDisplayCanvas(debugCanvas);
                Steering.setup(camera, skinColor);
                Steering.start(10);
                Engine.initialize(1, gameCanvas);
                Engine.step(0);
            }, 1000);
        }

        var getSteeringAngle = function() {
            return Steering.theta();
        }

        return {
            setCameraDimensions: setCameraDimensions,
            initialize: initializeSteeringAndGame,
            getSteeringAngle: getSteeringAngle
        }
    }
}
