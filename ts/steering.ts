/// <reference path="./util.ts" />

module steering {

	var camera: util.Camera = null;
    var skinColor: util.Color = null;

    // If camera and skin color are not set, returns immediately. Otherwise, starts steering
    // algorithm.
    function start() {
        if (!camera.ready() || skinColor == null)
            return;


    }
}
