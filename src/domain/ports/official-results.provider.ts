export interface RaceMeetingData {
    externalMeetingKey: number;
    name: string;
    circuit: string;
    country: string;
    qualifyingStartAt: Date | null;
    raceStartAt: Date | null;
    isCancelled: boolean;
}

export interface DriverPositionData {
    externalDriverNumber: number;
    position: number | null;
    dnf: boolean;
}

export interface OfficialResultsProvider {
    getMeetings(year: number): Promise<RaceMeetingData[]>;
    getDriverPositions(sessionKey: number): Promise<DriverPositionData[]>;
}