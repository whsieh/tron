/// <reference path="./references.ts" />
module Data {
    export WIDTH = 1000;
    export HEIGHT = 1000;

    export interface Point {
        x: number;
        y: number;
    }

    export class Player {
        curPos : Point;
        normalizedTheta : number;
        isDead : boolean;
        trail : Point[];
        lookAt: Point;
    }

    export class GameState {
        numPlayers : number;
        players : Player[];
        recentlyDead : number[];
    }
}
