export abstract class DriverRepository {
    abstract upsert(data: {
        driverNumber: number;
        name: string;
        acronym: string;
        teamId: string;
        seasonId: string;
    }): Promise<string>;
    abstract findByDriverNumber(driverNumber: number, seasonId: string): Promise<{ id: string } | null>;
}