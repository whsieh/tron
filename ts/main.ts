/// <reference path="./util.ts" />
/// <reference path="./setup.ts" />

$(document).ready(function() {
    var canvasElement = <HTMLCanvasElement> $("#canvas")[0];
    var videoElement = <HTMLVideoElement> $("#video")[0];

    var cam = new util.Camera(videoElement, canvasElement, function(e) {console.log(e)});

    cam.start();

    // var testCanvas = <HTMLCanvasElement> $("#test")[0];
    // var context = testCanvas.getContext("2d");
    // var rgbData = new util.RGBData(videoElement.width, videoElement.height);

    // window.setTimeout(function() {
    //     rgbData.setFrame(cam.getFrame());

    //     var pixel: any = {};
    //     for (var i = 0; i < videoElement.width; i++) {
    //         for (var j = 0; j < videoElement.height; j++) {
    //             rgbData.getPixelColor(i, j, pixel);
    //             pixel.r = 0;
    //             rgbData.setPixelColor(i, j, pixel);
    //         }
    //     }
    //     context.putImageData(rgbData.getFrame(), 0, 0);
    //     }, 5000);

    // var test = $("#test");
    // var rgbData = new util.RGBData(videoElement.width, videoElement.height);

    // $("html,body").keypress(function (e) {
    //     // Spacebar
    //     if (e.keyCode === 32) {
    //         rgbData.setFrame(cam.getFrame());

    //         var color = setup.getAverageColor(rgbData, 0, 0, videoElement.width,
    //             videoElement.height);

    //         util.roundColor(color);
    //         test.css({"background-color": "rgb(" + color.r + "," + color.g + "," + color.b + ")"});
    //     }
    // });

});
