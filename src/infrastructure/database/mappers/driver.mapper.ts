import { Driver as PrismaDriver } from '@prisma/client';
import { Driver } from "../../../domain/entities/driver.entity";

export class DriverMapper {
    static toDomain(prismaDriver: PrismaDriver): Driver {
        return Driver.create({
            id: prismaDriver.id,
            name: prismaDriver.name,
            acronym: prismaDriver.acronym,
            driverNumber: prismaDriver.driverNumber,
            seasonId: prismaDriver.seasonId,
            teamId: prismaDriver.teamId,
        });
    }

    static toPersistance(driver: Driver) {
        return {
            id: driver.id,
            name: driver.name,
            acronym: driver.acronym,
            driverNumber: driver.driverNumber,
            seasonId: driver.seasonId,
            teamId: driver.teamId,
        };
    }
}