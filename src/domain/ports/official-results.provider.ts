export interface RaceMeetingData {
    meetingKey: number;
    raceSessionKey: number | null;
    qualifyingSessionKey: number | null;
    latestSessionKey: number | null;
    name: string;
    circuit: string;
    country: string;
    qualifyingStartAt: Date | null;
    raceStartAt: Date | null;
    isCancelled: boolean;
}

export interface DriverSessionResult {
    externalDriverNumber: number;
    position: number;
    dnf: boolean;
}

export interface DriverData {
    driverNumber: number;
    fullName: string;
    acronym: string;
    teamName: string;
    teamColour: string;
  }

export abstract class OfficialResultsProvider {
    abstract getMeetings(year: number): Promise<RaceMeetingData[]>;
    abstract getSessionResults(sessionKey: number): Promise<DriverSessionResult[]>;
    abstract hasRaceResults(sessionKey: number): Promise<boolean>;
    abstract hasSafetyCar(sessionKey: number): Promise<boolean>;
    abstract getDrivers(sessionKey: number): Promise<DriverData[]>;
}