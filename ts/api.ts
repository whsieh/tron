/// <reference path="./references.ts" />

module Coordinator {

    export function create(cameraVideoId: String, setupCanvasId: String, leftCanvasId: String, centerCanvasId: String, rightCanvasId: String): any {

        var cameraVideo: HTMLVideoElement = null;
        var leftCanvas: HTMLCanvasElement = null;
        var rightCanvas: HTMLCanvasElement = null;
        var centerCanvas: HTMLCanvasElement = null;
        var setupCanvas: HTMLCanvasElement = null;
        var camera: Util.Camera = null;
        var smallScreenWidth: number = 250;
        var smallScreenHeight: number = 190;
        var largeScreenWidth: number = 800;
        var largeScreenHeight: number = 600;
        var skinCaptureRegionLeft: number;
        var skinCaptureRegionTop: number;
        var skinCaptureRegionWidth: number;
        var skinCaptureRegionHeight: number;
        var didCaptureSkinColor: boolean = false;
        var cameraOverlayFontSize: number = 16;
        var cameraCountdownFontSize: number = 24;
        var cameraPermissionReloadHash: string = "#camera_permission_denied";

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
            if (location.href.match(cameraPermissionReloadHash) == null) {
                location.href += cameraPermissionReloadHash;
                location.reload()
            }
        });

        var setSmallScreenDimensions = function(width: number, height: number) {
            smallScreenWidth = width;
            smallScreenHeight = height;
        }

        var setLargeScreenDimensions = function(width: number, height: number) {
            largeScreenWidth = width;
            largeScreenHeight = height;
        }

        var setSkinCaptureRegion = function(left: number, top: number, width: number, height: number): void {
            skinCaptureRegionLeft = left;
            skinCaptureRegionTop = top;
            skinCaptureRegionWidth = width;
            skinCaptureRegionHeight = height;
            camera.setRenderCameraOverlay(function(context: CanvasRenderingContext2D) {
                renderCameraOverlay(context);
                context.save();
                context.fillStyle = "#FF0000";
                context.font = cameraOverlayFontSize + "px Open Sans";
                context.fillText("Press any key to begin capture.",
                    skinCaptureRegionLeft,
                    skinCaptureRegionTop + skinCaptureRegionHeight + cameraOverlayFontSize + 4);
                context.restore();
            });
        }

        var renderCameraOverlay = function(context: CanvasRenderingContext2D) {
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
        }

        var captureSkinColorAfterDelay = function(captureDelay) {
            var captureStartTime:number = new Date().getTime();
            camera.setRenderCameraOverlay(function(context: CanvasRenderingContext2D) {
                var currentTime = new Date().getTime();
                var timeInMSSinceCaptureBegan = currentTime - captureStartTime;
                if (timeInMSSinceCaptureBegan <= captureDelay) {
                    renderCameraOverlay(context);
                    context.save();
                    context.fillStyle = "#FF0000";
                    context.font = cameraCountdownFontSize + "px Open Sans";
                    context.fillText(String(Math.round((captureDelay - timeInMSSinceCaptureBegan) / 1000)),
                        skinCaptureRegionLeft + skinCaptureRegionWidth,
                        skinCaptureRegionTop + skinCaptureRegionHeight + cameraCountdownFontSize + 4);
                    context.restore();
                } else
                    camera.setRenderCameraOverlay(null);
            });
            setTimeout(function() {
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
        }

        var initializeSteeringAndGame = function() {
            if (!camera.ready())
                setTimeout(initializeSteeringAndGame, 500);

            else {
                camera.cropResize(largeScreenWidth, largeScreenHeight);
                camera.start();
            }
        }

        var getSteeringAngle = function() {
            return Steering.theta();
        }

        return {
            setSmallScreenDimensions: setSmallScreenDimensions,
            setLargeScreenDimensions: setLargeScreenDimensions,
            setSkinCaptureRegion: setSkinCaptureRegion,
            initialize: initializeSteeringAndGame,
            getSteeringAngle: getSteeringAngle,
            captureSkinColorAfterDelay: captureSkinColorAfterDelay
        }
    }
}
