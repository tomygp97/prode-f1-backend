import { Driver } from "../entities/driver.entity";

export interface DriverRepositoryResult {
    id: string;
    driverNumber: number;
    teamId: string;
}

export abstract class DriverRepository {
    abstract upsert(data: {
        driverNumber: number;
        name: string;
        acronym: string;
        teamId: string;
        seasonId: string;
    }): Promise<string>;

    abstract findByDriverNumbers(
        seasonId: string,
        driverNumbers: number[],
    ): Promise<DriverRepositoryResult[]>;

    abstract findAll(): Promise<Driver[]>;

    abstract findById(id: string): Promise<Driver | null>;
}