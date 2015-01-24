/// <reference path="./references.ts" />
/// <reference path="./engine.ts" />
/// <reference path="./steering.ts" />
/// <reference path="./util.ts" />
/// <reference path="./setup.ts" />

module TronCoordinator {

export function setup(cameraVideoId: String, cameraCanvasId: String, debugCanvasId: String, gameCanvasId: String) {
    var cameraVideo = <HTMLVideoElement> findFirstElementFromId(cameraVideoId);
    if (cameraVideo == null)
        return console.log("Setup failed: could not find camera's video element \"" + cameraVideoId + "\"");

    var cameraCanvas = <HTMLCanvasElement> findFirstElementFromId(cameraCanvasId);
    if (cameraCanvas == null)
        return console.log("Setup failed: could not find camera's canvas element \"" + cameraCanvasId + "\"");

    var debugCanvas = <HTMLCanvasElement> findFirstElementFromId(debugCanvasId);
    if (debugCanvas == null)
        return console.log("Setup failed: could not find debug canvas \"" + debugCanvasId + "\"");

    var gameCanvas = <HTMLCanvasElement> findFirstElementFromId(gameCanvasId);
    if (gameCanvas == null)
        return console.log("Setup failed: could not find game canvas \"" + gameCanvasId + "\"");

    var camera = new Util.Camera(cameraVideo, cameraCanvas, function(e) {
        console.log("Failed to initialize camera with error:" + e.name);
    });
    Steering.setDisplayCanvas(debugCanvas);
    initializeSteeringWithCamera(camera);
}

function initializeSteeringWithCamera(camera: Util.Camera) {
    if (!camera.ready()) {
        setTimeout(function() {
            initializeSteeringWithCamera(camera);
        }, 1000);
        return;
    }
    camera.cropResize(200, 150);
    camera.start();

    console.log("Capturing skin color in 3 seconds...");
    setTimeout(function() {
        var rgbData = new Util.RGBData(200, 150);
        rgbData.setFrame(camera.getFrame());
        var skinColor = Setup.getAverageColor(rgbData, 40, 30, 120, 90)

        Steering.setup(camera, skinColor);
        Steering.start(10);
    }, 3000);
}

function findFirstElementFromId(id: String) {
    var elementId = id.charAt(0) == "#" ? id : ("#" + id);
    var matchingElements = <any> $(elementId);
    return matchingElements.size() == 0 ? null : matchingElements[0];
}

}
