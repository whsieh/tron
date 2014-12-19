/// <reference path="./references.ts" />

module steering {

    //============================================================
    // Internal interfaces
    //============================================================

    interface Pixel {
        i: number; j: number;
    }

    //============================================================
    // Global variables
    //============================================================

    var camera: util.Camera = null;
    var skinColor: util.Color = null;
    var rgbData: util.RGBData = null;
    var canvases: HTMLCanvasElement[] = [];

    var id = null;

    //============================================================
    // Functions that control the steering module
    //============================================================

    export function setup(_camera: util.Camera, _skinColor: util.Color) {
        camera = _camera;
        skinColor = _skinColor;
        rgbData = new util.RGBData(camera.width(), camera.height());
    }

    // If camera or skinColor is not set, or camera is not ready, return immediately. Otherwise, start
    // steering algorithm, which runs at the rate specified by pollFrequency (in ms).
    export function start(pollFrequency) {
        if (camera == null || !camera.ready() || skinColor == null)
            return;

        id = window.setInterval(util.bind(this, function() {
            calculateSteeringTheta();
        }), pollFrequency);
    }

    export function stop() {
        if (id !== null)
            window.clearInterval(id);
            id = null;
    }

    export function getSkinColor(): util.Color {
        return skinColor;
    }

    // Handles all 
    function calculateSteeringTheta() {
        rgbData.setFrame(camera.getFrame());

        var color: util.Color = new util.Color();
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
                    skinPixels.push({i: i, j: j});
                }
            }
        }

        // Finding average skin pixel positions, assuming screen split in half
        var leftAvgPixel: Pixel = {i: 0, j: 0};
        var rightAvgPixel: Pixel = {i: 0, j: 0};
        var halfI: number = rgbData.width / 2;
        var pixel: Pixel;

        var leftPixelCount = 0;
        var rightPixelCount = 0;
        for (var i = 0; i < skinPixels.length; i++) {
            pixel = skinPixels[i];

            if (pixel.i < halfI) {
                leftAvgPixel.i += pixel.i;
                leftAvgPixel.j += pixel.j;
                leftPixelCount++;
            } else {
                rightAvgPixel.i += pixel.i;
                rightAvgPixel.j += pixel.j;
                rightPixelCount++;
            }
        }

        leftAvgPixel.i /= leftPixelCount;
        leftAvgPixel.j /= leftPixelCount;
        rightAvgPixel.i /= rightPixelCount;
        rightAvgPixel.j /= rightPixelCount;

        _.each(canvases, function(canvas) {
            var context = canvas.getContext("2d");
            context.clearRect(0, 0, rgbData.width, rgbData.height);
            context.fillStyle = "rgb(0, 0, 0)";
            for (var i = 0; i < skinPixels.length; i++) {
                pixel = skinPixels[i];
                context.fillRect(pixel.i - 1, pixel.j - 1, 3, 3);
            }

            context.fillStyle = "rgb(255, 0, 0)";
            context.fillRect(leftAvgPixel.i - 1, leftAvgPixel.j - 1, 3, 3);
            context.fillRect(rightAvgPixel.i - 1, rightAvgPixel.j - 1, 3, 3);
        });
    }

    export function addDisplayCanvas(canvas: HTMLCanvasElement) {
        canvases.push(canvas);
    }
}
