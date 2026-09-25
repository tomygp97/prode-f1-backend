import { Driver, RaceEntry as PrismaRaceEntry, Team } from '@prisma/client';
import { RaceEntry } from '../../../domain/entities/race-entry.entity';
import { RaceGridEntryView } from '../../../domain/views/race-grid.view';

export class RaceEntryMapper {
    static toDomain(raw: PrismaRaceEntry): RaceEntry {
        return RaceEntry.create({
            id: raw.id,
            raceId: raw.raceId,
            driverId: raw.driverId,
            teamId: raw.teamId,
        });
    }

    static toGridView(raw: PrismaRaceEntry & { driver: Driver; team: Team }): RaceGridEntryView {
        return {
            driverId: raw.driverId,
            driverNumber: raw.driver.driverNumber,
            name: raw.driver.name,
            acronym: raw.driver.acronym,
            team: {
                id: raw.team.id,
                name: raw.team.name,
                colour: raw.team.colour,
            },
        };
    }
}
