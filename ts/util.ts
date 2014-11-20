module util {
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

    // Simple helper to bind a context with a function
    export function bind(ctx, func) {
        return function() {
            func.apply(ctx, arguments);
        }
    }

    // Simple camera wrapper class that can associate one canvas element and one video element
    // together.
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
            getUserMedia({video: true}, function(stream) {
                this.video.src = URL.createObjectURL(stream);
                // Set default source and destination dimensions
                this.destinationWidth = this.video.width;
                this.destinationHeight = this.video.height;
                this.sourceWidth = this.destinationWidth;
                this.sourceHeight = this.destinationHeight;
                this.isReady = true;
            }, errorHandler);

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
            this.context.drawImage(this.video, 0, 0, this.video.width, this.video.height);
            if (this.isCapturing)
                requestAnimationFrame(bind(this, this.draw));
        }

        cropResize(width: number, height: number) {
            if (!this.ready()) return;
            this.sourceWidth = width;
            this.sourceHeight = height;
            var aspectRatio = width / height;
            if (aspectRatio * this.video.height > this.video.width) {
                // Limited by the width
                this.destinationWidth = this.video.width;
                this.destinationHeight = this.video.width / aspectRatio;
            } else {
                // Limited by the height
                this.destinationWidth = this.video.height * aspectRatio;
                this.destinationHeight = this.video.height;
            }
        }

        getFrame(): ImageData {
            if (!this.ready() || !isCapturing) return;
            return this.context.getImageData(0, 0, this.video.width, this.video.height);
        }
    }

    // Simple color class
    export class Color {
        r: number = 0; g: number = 0; b: number = 0;
    }

    // Simple wrapper around a constant sized ImageData object to extract and manipulate rgb
    // information.
    //
    // Warning. No edge case testing.
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
    export function roundColor(color: Color): void {
        color.r = Math.round(color.r);
        color.g = Math.round(color.g);
        color.b = Math.round(color.b);
    }
}
