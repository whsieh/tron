/// <reference path="./references.ts" />

$(document).ready(function() {
    var canvasElement = <HTMLCanvasElement> $("#canvas")[0];
    var videoElement = <HTMLVideoElement> $("#video")[0];

    var camera = new util.Camera(videoElement, canvasElement, function(e) {console.log(e)});

    var id = window.setInterval(function () {
        if (camera.ready()) {
            camera.cropResize(400, 400);
            camera.start();

            window.setTimeout(function() {
                var rgbData = new util.RGBData(400, 400);
                rgbData.setFrame(camera.getFrame());
                var color = setup.getAverageColor(rgbData, 150, 150, 100, 100);

                steering.setup(camera, color);
                steering.addDisplayCanvas(<any> $("#test")[0]);
                steering.start(30);
            }, 3000);
            window.clearInterval(id);
        }
    }, 1000);

});
