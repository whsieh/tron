/// <reference path="./util.ts" />

module setup {
    // Average a box within the data, does not check for out of bounds error.
    export function getAverageColor(data: util.RGBData, px: number, py: number, dx: number,
        dy: number)
    {
        var accumulatedColor: util.Color = {r: 0, g: 0, b: 0};
        var color: util.Color = {r: 0, g: 0, b: 0};
        var t = 1;
        for (var i = px; i < px + dx; i++) {
            for (var j = py; j < py + dy; j++, t++) {
                data.getPixelColor(i, j, color)
                accumulatedColor.r += color.r;
                accumulatedColor.g += color.g;
                accumulatedColor.b += color.b;
            }
        }

        accumulatedColor.r = accumulatedColor.r / t;
        accumulatedColor.g = accumulatedColor.g / t;
        accumulatedColor.b = accumulatedColor.b / t;

        return accumulatedColor;
    }
}
