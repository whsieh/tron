/// <reference path="./references.ts" />
/// <reference path="./engine.ts" />
/// <reference path="./steering.ts" />
/// <reference path="./util.ts" />
/// <reference path="./setup.ts" />

module Coordinator {

var cameraVideo: HTMLVideoElement = null;
var cameraCanvas: HTMLCanvasElement = null;
var debugCanvas: HTMLCanvasElement = null;
var gameCanvas: HTMLCanvasElement = null;
var camera: Util.Camera = null;
var cameraWidth: number;
var cameraHeight: number;

export class SetupOptions {
    constructor(cameraVideoId: String, cameraCanvasId: String, debugCanvasId: String, gameCanvasId: String) {
        this.cameraVideoId = cameraVideoId;
        this.cameraCanvasId = cameraCanvasId;
        this.debugCanvasId = debugCanvasId;
        this.gameCanvasId = gameCanvasId;
    }

    public setCameraDimensions(width: number, height: number) {
        this.cameraWidth = width;
        this.cameraHeight = height;
    }

    cameraVideoId: String;
    cameraCanvasId: String;
    debugCanvasId: String;
    gameCanvasId: String;
    cameraWidth: number = 200;
    cameraHeight: number = 150;
}

export function setup(options: SetupOptions): any {
    cameraVideo = <HTMLVideoElement> findFirstElementFromId(options.cameraVideoId);
    if (cameraVideo == null)
        return console.log("Setup failed: could not find camera's video element \"" + options.cameraVideoId + "\"");

    cameraCanvas = <HTMLCanvasElement> findFirstElementFromId(options.cameraCanvasId);
    if (cameraCanvas == null)
        return console.log("Setup failed: could not find camera's canvas element \"" + options.cameraCanvasId + "\"");

    debugCanvas = <HTMLCanvasElement> findFirstElementFromId(options.debugCanvasId);
    if (debugCanvas == null)
        return console.log("Setup failed: could not find debug canvas \"" + options.debugCanvasId + "\"");

    gameCanvas = <HTMLCanvasElement> findFirstElementFromId(options.gameCanvasId);
    if (gameCanvas == null)
        return console.log("Setup failed: could not find game canvas \"" + options.gameCanvasId + "\"");

    camera = new Util.Camera(cameraVideo, cameraCanvas, function(e) {
        console.log("Failed to initialize camera with error:" + e.name);
    });
    cameraWidth = options.cameraWidth
    cameraHeight = options.cameraHeight
    return {
        initialize: initializeSteering
    }
}

function initializeSteering() {
    if (!camera.ready()) {
        setTimeout(initializeSteering, 1000);
        return;
    }
    camera.cropResize(cameraWidth, cameraHeight);
    camera.start();

    console.log("Preparing to capture skin color...");
    setTimeout(function() {
        var rgbData = new Util.RGBData(cameraWidth, cameraHeight);
        rgbData.setFrame(camera.getFrame());
        var skinColor = Setup.getAverageColor(rgbData, cameraWidth / 4, cameraHeight / 4, cameraWidth / 2, cameraHeight / 2);

        console.log("    Skin color: [r=" + skinColor.r + ", g=" + skinColor.g + ", b=" + skinColor.b + "]");
        Steering.setDisplayCanvas(debugCanvas);
        Steering.setup(camera, skinColor);
        Steering.start(10);
    }, 1000);
}

function findFirstElementFromId(id: String) {
    var elementId = id.charAt(0) == "#" ? id : ("#" + id);
    var matchingElements = <any> $(elementId);
    return matchingElements.size() == 0 ? null : matchingElements[0];
}

}
