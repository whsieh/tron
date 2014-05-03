interface getNormalizedTheta {
    (): number;
}

interface startSteeringLoop {
    (pollFreq?: number): void;
}

interface stopSteeringLoop {
    (): void;
}
