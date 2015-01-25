/// <reference path="./references.ts" />

module Setup {
    // Average a box within the data, does not check for out of bounds error.
    export function getAverageColor(data: Util.RGBData, left: number, top: number, width: number, height: number)
    {
        var accumulatedColor: Util.Color = {r: 0, g: 0, b: 0};
        var color: Util.Color = {r: 0, g: 0, b: 0};
        var numPixelsSampled = 0;
        for (var i = left; i < left + width; i++) {
            for (var j = top; j < top + height; j++) {
                data.getPixelColor(i, j, color);
                accumulatedColor.r += color.r;
                accumulatedColor.g += color.g;
                accumulatedColor.b += color.b;
                numPixelsSampled++;
            }
        }

        accumulatedColor.r = accumulatedColor.r / numPixelsSampled;
        accumulatedColor.g = accumulatedColor.g / numPixelsSampled;
        accumulatedColor.b = accumulatedColor.b / numPixelsSampled;

        return accumulatedColor;
    }
}
