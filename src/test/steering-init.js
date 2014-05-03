
console.log("+ Loading steering.js...")

var video = document.querySelector("video");
var realcanv = $("#real-canv")[0];
var realctx = realcanv.getContext("2d");
var localMediaStream = null;
var imageData = null;

var CAM_WIDTH = realcanv.getBoundingClientRect().width;
var CAM_HEIGHT = realcanv.getBoundingClientRect().height;
var POLL_GAP = 10;
var VOXEL_WIDTH = CAM_WIDTH / POLL_GAP;
var VOXEL_HEIGHT = CAM_HEIGHT / POLL_GAP;
var THRESHOLD = 500;
var MAX_THETA = 1.25;
var MIN_THETA = -1.25;
var DFLT_POLL_FREQ = 250;
var loopNo = -1;

var theta = 0;
var lastKnownLHand = null;
var lastKnownRHand = null;

var voxelMap = []
for (var i = 0; i < VOXEL_HEIGHT; i++) {
    voxelMap.push(Array(VOXEL_WIDTH))
}
var skinColor = [10, 0, 40];

navigator.getUserMedia = navigator.getUserMedia ||
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia ||
                        navigator.msGetUserMedia;

function __getImageAccessor(imgData) {
    var data = imgData.data;
    var width = imgData.width;
    var height = imgData.height;
    function get(x, y) {
        if (x < 0 || y < 0 || x >= width || y >= height) {
            throw new Error("Point (" + x + "," + y + ") lies outside valid range.");
        } else {
            cell = 4*(y*width + x);
            return [data[cell], data[cell+1], data[cell+2]];
        }
    }
    function set(x, y, r, g, b) {
        if (x < 0 || y < 0 || x >= width || y >= height) {
            throw new Error("Point (" + x + "," + y + ") lies outside valid range.");
        } else {
            cell = 4*(y*width + x);
            data[cell] = r;
            data[cell+1] = g;
            data[cell+2] = b;
        }
    }
    return { "get": get, "set": set};
}

function __drawImageData() {
    realcanv.setImageData(imgData);
}

function __pause() {
    video.pause();
}

function __play() {
    video.play();
}

function updateSkinColor() {
    __play();
    setTimeout( function() {
        if (localMediaStream) {
            realctx.drawImage(video, 0, 0);
            var rect = realcanv.getBoundingClientRect();
            imgData = realctx.getImageData(0, 0, rect.width, rect.height);
            skinColor = __scanAverageRGB();
            console.log("  + Image taken.");
            __pause();
        }
    }, 100);
}

function __scanAverageRGB() {
    var access = __getImageAccessor(imgData)
    var get = access["get"],
        set = access["set"];
    // var skin = __getColorPickerRGB();
    var wLow = CAM_WIDTH/2 - 50
        wUpp = CAM_WIDTH/2 + 50
        hLow = CAM_HEIGHT/2 - 50
        hUpp = CAM_HEIGHT/2 + 50
    var r = 0, g = 0, b = 0, t = 0;
    for (var i = wLow; i < wUpp; i++) {
        for (var j = hLow; j < hUpp; j++) {
            var vec = get(i, j);
            r += vec[0];
            g += vec[1];
            b += vec[2];
            t++;
        }
    }
    console.log([r/t, g/t, b/t]);
    return [r/t, g/t, b/t];
}

navigator.getUserMedia({video: true, audio: false}, function(stream) {
    video.src = window.URL.createObjectURL(stream);
    localMediaStream = stream;
}, function(e) {
    console.log("WEBCAM REJECTED OH NOES", e);
});
