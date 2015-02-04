/// <reference path="./references.ts" />

module Steering {

    //============================================================
    // Internal interfaces
    //============================================================

    interface Pixel {
        x: number; y: number;
    }

    //============================================================
    // Global variables
    //============================================================

    var camera: Util.Camera = null;
    var skinColor: Util.Color = null;
    var rgbData: Util.RGBData = null;
    var canvas: HTMLCanvasElement = null;
    var lastKnownLeftAvgPixel: Pixel;
    var lastKnownRightAvgPixel: Pixel;

    var isCurrentlyDetectingHands: boolean;
    var samplingStride: number;
    var id = null;
    var currentRawTheta: number;
    var minPointCountThreshold: number;
    var updateAlpha:number; // alpha = 1 means we only consider the most recent theta.
                            // alpha = 0 means we'll use very first theta for the rest of eternity.

    //============================================================
    // Functions that control the steering module
    //============================================================

    export function setup(_camera: Util.Camera, _skinColor: Util.Color, _updateAlpha: number = 0.75, _samplingStride: number = 2, _minPointCountThreshold: number = 10) {
        camera = _camera;
        skinColor = _skinColor;
        rgbData = new Util.RGBData(camera.width(), camera.height());
        updateAlpha = _updateAlpha
        samplingStride = _samplingStride;
        minPointCountThreshold = _minPointCountThreshold;
        currentRawTheta = 0;
        lastKnownLeftAvgPixel = {x: 0, y: 0};
        lastKnownRightAvgPixel = {x: 0, y: 0};
        isCurrentlyDetectingHands = false;
    }

    // If camera or skinColor is not set, or camera is not ready, return immediately. Otherwise, start
    // steering algorithm, which runs at the rate specified by pollFrequency (in ms).
    export function start(pollFrequency) {
        if (camera == null || !camera.ready() || skinColor == null)
            return;

        id = window.setInterval(Util.bind(this, function() {
            calculateSteeringTheta();
        }), 1000 / pollFrequency);
    }

    export function stop() {
        if (id !== null)
            window.clearInterval(id);
            id = null;
    }

    export function getSkinColor(): Util.Color {
        return skinColor;
    }

    export function isActivelySteering(): boolean {
        return isCurrentlyDetectingHands;
    }

    function calculateSteeringTheta() {
        rgbData.setFrame(camera.getFrame());

        var color: Util.Color = new Util.Color();
        var dist: number;
        var halfWidth: number = rgbData.width / 2;

        var skinPixels: Pixel[] = [];
        var baseSkinColorThreshold: number = 1500;

        // Gathering skin pixels
        for (var i = 0; i < rgbData.width; i += samplingStride) {
            var centerDistanceCoefficient: number = Math.abs(i - halfWidth) / halfWidth;
            for (var j = 0; j < rgbData.height; j += samplingStride) {
                rgbData.getPixelColor(i, j, color);
                dist = Math.pow(color.r - skinColor.r, 2) + Math.pow(color.g - skinColor.g, 2) + Math.pow(color.b - skinColor.b, 2);
                if (dist < baseSkinColorThreshold * centerDistanceCoefficient)
                    skinPixels.push({x: i, y: j});
            }
        }

        // Finding average skin pixel positions, assuming screen split in half
        var leftAvgPixel: Pixel = {x: 0, y: 0};
        var rightAvgPixel: Pixel = {x: 0, y: 0};
        var pixel: Pixel;

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

    export function setDisplayCanvas(_canvas: HTMLCanvasElement) {
        canvas = _canvas;
    }

    export function theta(): number {
        return 2.0 * currentRawTheta / Math.PI;
    }
}
