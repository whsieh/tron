/// <reference path="./util.ts" />
/// <reference path="./setup.ts" />

$(document).ready(function() {
    var canvasElement = <HTMLCanvasElement> $("#canvas")[0];
    var videoElement = <HTMLVideoElement> $("#video")[0];

    var camera = new util.Camera(videoElement, canvasElement, function(e) {console.log(e)});

    var id = window.setInterval(function () {
        if (camera.ready()) {
            camera.cropResize(900, 200);
            camera.start();
            window.clearInterval(id);
        }
    }, 1000);

});
