import { Injectable, NotFoundException } from '@nestjs/common';
import { Season } from '../../../domain/entities/season.entity';
import { SeasonRepository } from '../../../domain/ports/season.repository';

@Injectable()
export class GetCurrentSeasonUseCase {
  constructor(
    private readonly seasonRepo: SeasonRepository,
  ) {}

  async execute(): Promise<Season> {
    const currentYear = new Date().getFullYear();
    const season = await this.seasonRepo.findByYear(currentYear);

    if (!season) {
      throw new NotFoundException(`No season found for year ${currentYear}`);
    }

    return season;
  }
}