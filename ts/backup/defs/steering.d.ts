interface StartSteering {
    (): void;
}

interface GetNormalizedTheta {
    (): number;
}

interface StartSteeringLoop {
    (pollFreq?: number): void;
}

interface StopSteeringLoop {
    (): void;
}
