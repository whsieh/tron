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

    var rawThetaWindow: number[] = [];
    var thetaWindowSize: number;
    var currentWindowOffset: number = 0;
    var id = null;

    //============================================================
    // Functions that control the steering module
    //============================================================

    export function setup(_camera: Util.Camera, _skinColor: Util.Color, _thetaWindowSize: number = 5) {
        camera = _camera;
        skinColor = _skinColor;
        rgbData = new Util.RGBData(camera.width(), camera.height());
        thetaWindowSize = _thetaWindowSize;
        for (var i = 0; i < thetaWindowSize; i++) {
            rawThetaWindow.push(0);
        }
    }

    // If camera or skinColor is not set, or camera is not ready, return immediately. Otherwise, start
    // steering algorithm, which runs at the rate specified by pollFrequency (in ms).
    export function start(pollFrequency) {
        if (camera == null || !camera.ready() || skinColor == null)
            return;

        id = window.setInterval(Util.bind(this, function() {
            calculateSteeringTheta();
        }), pollFrequency);
    }

    export function stop() {
        if (id !== null)
            window.clearInterval(id);
            id = null;
    }

    export function getSkinColor(): Util.Color {
        return skinColor;
    }

    // Handles all
    function calculateSteeringTheta() {
        rgbData.setFrame(camera.getFrame());

        var color: Util.Color = new Util.Color();
        var dist: number;

        var skinPixels: Pixel[] = [];
        var skinColorThreshold: number = 1000;

        // Gathering skin pixels
        for (var i = 0; i < rgbData.width; i++) {
            for (var j = 0; j < rgbData.height; j++) {
                rgbData.getPixelColor(i, j, color);
                dist = Math.pow(color.r - skinColor.r, 2)
                    + Math.pow(color.g - skinColor.g, 2)
                    + Math.pow(color.b - skinColor.b, 2);

                if (dist < skinColorThreshold) {
                    skinPixels.push({x: i, y: j});
                }
            }
        }

        // Finding average skin pixel positions, assuming screen split in half
        var leftAvgPixel: Pixel = {x: 0, y: 0};
        var rightAvgPixel: Pixel = {x: 0, y: 0};
        var halfI: number = rgbData.width / 2;
        var pixel: Pixel;

        var leftPixelCount = 0;
        var rightPixelCount = 0;
        for (var i = 0; i < skinPixels.length; i++) {
            pixel = skinPixels[i];

            if (pixel.x < halfI) {
                leftAvgPixel.x += pixel.x;
                leftAvgPixel.y += pixel.y;
                leftPixelCount++;
            } else {
                rightAvgPixel.x += pixel.x;
                rightAvgPixel.y += pixel.y;
                rightPixelCount++;
            }
        }

        leftAvgPixel.x /= leftPixelCount;
        leftAvgPixel.y /= leftPixelCount;
        rightAvgPixel.x /= rightPixelCount;
        rightAvgPixel.y /= rightPixelCount;

        var currentRawTheta = 0;
        if (rightAvgPixel.x != leftAvgPixel.x) {
            currentRawTheta = Math.asin((rightAvgPixel.y - leftAvgPixel.y) / (rightAvgPixel.x - leftAvgPixel.x));
        }
        rawThetaWindow[currentWindowOffset] = currentRawTheta;
        currentWindowOffset = (currentWindowOffset + 1) % thetaWindowSize;

        var context = canvas.getContext("2d");
        context.clearRect(0, 0, rgbData.width, rgbData.height);
        context.fillStyle = "rgb(0, 0, 0)";
        for (var i = 0; i < skinPixels.length; i++) {
            pixel = skinPixels[i];
            context.fillRect(pixel.x - 1, pixel.y - 1, 3, 3);
        }

        context.fillStyle = "rgb(255, 0, 0)";
        context.fillRect(leftAvgPixel.x - 1, leftAvgPixel.y - 1, 3, 3);
        context.fillRect(rightAvgPixel.x - 1, rightAvgPixel.y - 1, 3, 3);
    }

    export function setDisplayCanvas(_canvas: HTMLCanvasElement) {
        canvas = _canvas;
    }

    export function theta(): number {
        var rawThetaSum: number = 0;
        for (var i = 0; i < thetaWindowSize; i++) {
            rawThetaSum += rawThetaWindow[i];
        }
        return rawThetaSum / thetaWindowSize;
    }
}
