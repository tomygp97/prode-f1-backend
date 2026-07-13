import { Inject, Injectable, Logger } from "@nestjs/common";
import type { RaceRepository } from "../../domain/ports/race.repository";
import { RaceStatus } from "../../domain/enums/race-status.enum";

@Injectable()
export class UpdateRaceStatusUseCase{
    constructor(
        @Inject('RaceRepository')
        private readonly raceRepository: RaceRepository,
    ) {}

    async execute(): Promise<void> {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        // 1. scheduled -> locked (qualy ya empezo)
        const toLock = await this.raceRepository.findScheduledBeforeDate(now);
        for (const race of toLock) {
            await this.raceRepository.updateStatus(race.id, RaceStatus.LOCKED);
        }

        // 2. locked -> finished (carrera termino)
        const toFinish = await this.raceRepository.findLockedBeforeDate(fiveMinutesAgo);
        for (const race of toFinish) {
            await this.raceRepository.updateStatus(race.id, RaceStatus.FINISHED)
        }
        
    }
}