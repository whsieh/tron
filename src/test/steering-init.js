
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
var skinColor = [255, 255, 255];

navigator.getUserMedia = navigator.getUserMedia ||
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia ||
                        navigator.msGetUserMedia;

function getNormalizedTheta() {
    return theta > 0 ? theta / MAX_THETA : theta / MIN_THETA;
}

function startSteeringLoop(pollFreq) {
    if (pollFreq == undefined) {
        pollFreq = DFLT_POLL_FREQ;
    }
    loopNo = setInterval(__snapshot, pollFreq);
}

function stopSteeringLoop() {
    if (loopNo != -1)
        clearInterval(loopNo);
    loopNo = -1;
}

function __snapshot() {
    __play();
    setTimeout( function() {
        if (localMediaStream) {
            realctx.drawImage(video, 0, 0);
            var rect = realcanv.getBoundingClientRect();
            imgData = realctx.getImageData(0, 0, rect.width, rect.height);
            __updateVoxelMap(imgData);
            console.log("  + Image taken.");
            __pause();
        }
    }, 100);
}

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

function __updateVoxelMap(imgData) {
    var access = __getImageAccessor(imgData)
    var get = access["get"],
        set = access["set"];
    // var skin = __getColorPickerRGB();
    var iVox = 0, jVox = 0;
    for (var i = 0; i < CAM_WIDTH; i+=POLL_GAP) {
        jVox = 0;
        for (var j = 0; j < CAM_HEIGHT; j+=POLL_GAP) {
            var vec = get(i, j);
            var r = vec[0],
                g = vec[1],
                b = vec[2];
            var sqdist = Math.pow(r - skinColor[0], 2) +
                        Math.pow(g - skinColor[1], 2) +
                        Math.pow(b - skinColor[2], 2);
            if (sqdist > THRESHOLD) {
                voxelMap[iVox][jVox] = false;
            } else {
                voxelMap[iVox][jVox] = true;
            }
            jVox++;
        }
        iVox++;
    }
    for (var i = 0; i < VOXEL_WIDTH; i++) {
        for (var j = 0; j < VOXEL_HEIGHT; j++) {
            if ((j+1 < VOXEL_HEIGHT && !voxelMap[i][j+1]) &&
                    (i+1 < VOXEL_WIDTH && !voxelMap[i+1][j]) &&
                    (j-1 >= 0 && !voxelMap[i][j-1]) &&
                    (i-1 >= 0 && !voxelMap[i-1][j])) {
                // make isolated voxels null
                voxelMap[i][j] = false;
            }
        }
    }
}

function __getColorPickerRGB() {
    var hstr = $(".color")[0].value;
    return [16 * __hexValue(hstr[0]) + __hexValue(hstr[1]),
            16 * __hexValue(hstr[2]) + __hexValue(hstr[3]),
            16 * __hexValue(hstr[4]) + __hexValue(hstr[5])];
}

function __hexValue(x) {
    x = x.toLowerCase();
    if (x == "a") {
        return 10;
    } else if (x == "b") {
        return 11;
    } else if (x == "c") {
        return 12;
    } else if (x == "d") {
        return 13;
    } else if (x == "e") {
        return 14;
    } else if (x == "f") {
        return 15;
    } else {
        return parseInt(x);
    }
}

function __findHandPositions(voxelMap) {

    var res = [{"x": 0, "y": 0}, {"x": 0, "y": 0}];
    var meanX = 0;
    var meanY = 0;
    var total = 0;
    for (var i = 0; i < VOXEL_WIDTH/2; i++) {
        for (var j = 0; j < VOXEL_HEIGHT; j++) {
            if (voxelMap[i][j]) {
                meanX += i;
                meanY += j;
                total++;
            }
        }
    }
    // console.log([meanX, meanY, total])
    if (total != 0) {
        res[0]["x"] = meanX / total;
        res[0]["y"] = meanY / total;
    } else {
        res[0]["x"] = -1;
        res[0]["y"] = -1;
    }

    meanX = 0;
    meanY = 0;
    total = 0;
    for (var i = VOXEL_WIDTH/2; i < VOXEL_WIDTH; i++) {
        for (var j = 0; j < VOXEL_HEIGHT; j++) {
            if (voxelMap[i][j]) {
                meanX += i;
                meanY += j;
                total++;
            }
        }
    }
    if (total != 0) {
        res[1]["x"] = meanX / total;
        res[1]["y"] = meanY / total;
    } else {
        res[1]["x"] = -1;
        res[1]["y"] = -1;
    }
    console.log([res[0].x, res[0].y, res[1].x, res[1].y])
    return res;
}

function __updateTheta(lhand, rhand) {
    var mid = { "x": (lhand.x + rhand.x) / 2,
                "y": (lhand.y + rhand.y) / 2}
    var sgn = lhand.y > rhand.y ? -1 : 1;
    var th = sgn * Math.asin(Math.abs(mid.y - rhand.y) / Math.abs(mid.x - rhand.x));
    theta = Math.max(Math.min(th, MAX_THETA), MIN_THETA);
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
