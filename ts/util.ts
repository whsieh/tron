module Util {

    function hasGetUserMedia(): boolean {
        return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia);
    }

    function getUserMedia() : any {
        return (navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia);
    }

    export class Camera {
        private canvases:HTMLCanvasElement[];
        addCanvas(canvas: HTMLCanvasElement): void {
            canvases.push(canvas);
        }

        start(): void {

        }
    }

}
