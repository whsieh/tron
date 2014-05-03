/// <reference path="./references.ts" />
module Data {
    export var WIDTH: number = 1000;
    export var HEIGHT: number = 1000;

    export interface Point {
        x: number;
        y: number;
    }

    export class Player {
        curPos : Point;
        normalizedTheta : number;
        isDead : boolean;
        trail : Point[];
        dir: THREE.Vector3;
    }

    export class GameState {
        numPlayers : number;
        players : Player[];
        recentlyDead : number[];
    }
}
