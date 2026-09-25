import { Driver } from "../entities/driver.entity";

export interface DriverRepositoryResult {
    id: string;
    driverNumber: number;
    teamId: string;
}

export abstract class DriverRepository {
    /** Crea o actualiza el piloto, incluido su equipo ACTUAL. Usar solo con datos de la carrera más reciente. */
    abstract upsert(data: {
        driverNumber: number;
        name: string;
        acronym: string;
        teamId: string;
        seasonId: string;
    }): Promise<string>;

    /** Agrega el piloto al plantel si no existe; si ya existe no toca nada (ni su equipo actual). */
    abstract createIfMissing(data: {
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