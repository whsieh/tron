module Data {
    export var WIDTH: number = 1000;
    export var HEIGHT: number = 1000;

    export interface Point {
        x: number;
        y: number;
    }

    export class Player {
        curPos : Point;
        curTheta: number;
        normalizedTheta : number;
        dir: THREE.Vector3;

        constructor(curPos: Point, normalizedTheta: number, dir: THREE.Vector3) {
            this.curPos = curPos;
            this.curTheta = 0;
            this.normalizedTheta = normalizedTheta;
            this.dir = dir.normalize();
        }
    }


    export class GameState {
        player : Player;
        obstacles: Obstacle[];
        isGameOver : boolean;
    }
}
