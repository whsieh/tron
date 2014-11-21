/// <reference path="./references.ts" />

$(document).ready(function() {
    var canvasElement = <HTMLCanvasElement> $("#canvas")[0];
    var videoElement = <HTMLVideoElement> $("#video")[0];

    var camera = new util.Camera(videoElement, canvasElement, function(e) {console.log(e)});

    var id = window.setInterval(function () {
        if (camera.ready()) {
            camera.cropResize(400, 400);
            camera.start();

            var rgbData = new util.RGBData(400, 400);
            rgbData.setFrame(camera.getFrame());
            var color = setup.getAverageColor(rgbData, 0, 0, 400, 400);

            steering.setup(camera, color);
            steering.start(5000);
            window.clearInterval(id);
        }
    }, 1000);

});
