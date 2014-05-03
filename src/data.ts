/// <reference path="./references.ts" />
module Data {
    export interface Point {
        x: number;
        y: number;
    }

    export class Player {
        curPos : Point;
        normalizedTheta : number;
        isDead : boolean;
        trail : Point[];
    }

    export class GameState {
        numPlayers : number;
        players : Player[];
        recentlyDead : number[];
    }
}
