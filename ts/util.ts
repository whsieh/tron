/// <reference path="./references.ts" />

module Util {

    //============================================================
    // General helper functions
    //============================================================

    // Simple helper to bind a context with a function
    export function bind(ctx, func) {
        return function() {
            func.apply(ctx, arguments);
        }
    }

    //============================================================
    // Wrapper classes
    //============================================================

    // Wrapper around an RGB value.
    export class Color {
        r: number = 0; g: number = 0; b: number = 0;
    }

    // Wrapper around a constant sized ImageData object. No edge case testing.
    export class RGBData {
        public imageData: ImageData;
        public width: number;
        public height: number;

        constructor(width: number, height: number) {
            this.width = width;
            this.height = height;
        }

        setFrame(imageData: ImageData) {
            this.imageData = imageData;
        }

        getFrame(): ImageData {
            return this.imageData;
        }

        getPixelColor(i: number, j: number, pixel: Color): void {
            var index = i * 4 + j * 4 * this.width;
            pixel.r = this.imageData.data[index + 0];
            pixel.g = this.imageData.data[index + 1];
            pixel.b = this.imageData.data[index + 2];
        }

        setPixelColor(i: number, j: number, pixel: Color): void {
            var index = i * 4 + j * 4 * this.width;
            this.imageData.data[index + 0] = pixel.r;
            this.imageData.data[index + 1] = pixel.g;
            this.imageData.data[index + 2] = pixel.b;
        }
    }

    // Simple helper function to round the color values.
    export function roundColor(color: Color): Color {
        var c: Color;
        c.r = Math.round(color.r);
        c.g = Math.round(color.g);
        c.b = Math.round(color.b);
        return c;
    }

    //============================================================
    // Helpers for obtaining user media
    //============================================================

    var nav = <any> navigator;

    function hasGetUserMedia(): boolean {
        return !!(nav.getUserMedia || nav.webkitGetUserMedia ||
            nav.mozGetUserMedia || nav.msGetUserMedia);
    }

    function getUserMedia(constraints, streamHandler, errorHandler): any {
        (nav.getUserMedia ||
            nav.webkitGetUserMedia ||
            nav.mozGetUserMedia ||
            nav.msGetUserMedia).call(nav, constraints, streamHandler, errorHandler);
    }

    //============================================================
    // Camera Class
    //============================================================

    export class Camera {
        private video: HTMLVideoElement;
        private canvas: HTMLCanvasElement;
        private context: CanvasRenderingContext2D;

        private isReady: boolean = false;
        private isCapturing: boolean = false;

        private sourceWidth: number;
        private sourceHeight: number;
        private destinationWidth: number;
        private destinationHeight: number;

        constructor(video: HTMLVideoElement, canvas: HTMLCanvasElement, errorHandler: any) {
            if (!hasGetUserMedia)
                return errorHandler({name: "Unsupported"});
            getUserMedia({video: true}, bind(this, function(stream) {
                this.video.src = URL.createObjectURL(stream);
            }), errorHandler);

            $(video).on("loadedmetadata", bind(this, function() {
                this.destinationWidth = this.video.width;
                this.destinationHeight = this.video.height;
                this.sourceWidth = this.video.videoWidth;
                this.sourceHeight = this.video.videoHeight;
                this.isReady = true;
            }));

            this.video = video;
            this.canvas = canvas;
            this.context = canvas.getContext("2d");
        }

        ready(): boolean {
            return this.isReady;
        }

        start(): void {
            if (!this.ready()) return;
            this.video.play();
            this.isCapturing = true;
            requestAnimationFrame(bind(this, this.draw))
        }

        stop(): void {
            this.video.pause();
            this.isCapturing = false;
        }

        private draw(): void {
            var sx: number = (this.video.videoWidth - this.sourceWidth) / 2;
            var sy: number = (this.video.videoHeight - this.sourceHeight) / 2;

            this.context.drawImage(this.video, sx, sy, this.sourceWidth, this.sourceHeight,
                0, 0, this.destinationWidth, this.destinationHeight);
            if (this.isCapturing)
                requestAnimationFrame(bind(this, this.draw));
        }

        cropResize(width: number, height: number) {
            if (!this.ready()) return;
            this.destinationWidth = width;
            this.destinationHeight = height;
            var aspectRatio = width / height;
            if (aspectRatio * this.video.videoHeight > this.video.videoWidth) {
                // Limited by the width
                this.sourceWidth = this.video.videoWidth;
                this.sourceHeight = this.video.videoWidth / aspectRatio;
            } else {
                // Limited by the height
                this.sourceWidth = this.video.videoHeight * aspectRatio;
                this.sourceHeight = this.video.videoHeight;
            }

            this.canvas.width = this.destinationWidth;
            this.canvas.height = this.destinationHeight;
        }

        getFrame(): ImageData {
            if (!this.ready() || !this.isCapturing) return;
            return this.context.getImageData(0, 0, this.destinationWidth, this.destinationHeight);
        }

        width(): number {
            if (!this.ready()) return 0;

            return this.destinationWidth;
        }

        height(): number {
            if (!this.ready()) return 0;

            return this.destinationHeight;
        }
    }
}
