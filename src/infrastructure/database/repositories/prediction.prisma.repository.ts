import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prediction } from '../../../domain/entities/prediction.entity';
import { PredictionRepository } from '../../../domain/ports/prediction.repository';
import { PredictionMapper } from '../mappers/prediction.mapper';

@Injectable()
export class PredictionPrismaRepository implements PredictionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(prediction: Prediction): Promise<void> {
    const data = PredictionMapper.toPersistence(prediction);
    await this.prisma.prediction.upsert({
      where: { id: prediction.id },
      create: data,
      update: data,
    });
  }

  async findByLeagueRaceAndUser(leagueId: string, raceId: string, userId: string): Promise<Prediction | null> {
    const raw = await this.prisma.prediction.findUnique({
      where: { leagueId_raceId_userId: { leagueId, raceId, userId } },
    });
    return raw ? PredictionMapper.toDomain(raw) : null;
  }

  async findAllByLeagueAndRace(leagueId: string, raceId: string): Promise<Prediction[]> {
    const raws = await this.prisma.prediction.findMany({
      where: { leagueId, raceId },
    });
    return raws.map(PredictionMapper.toDomain);
  }

  async findAllByRaceId(raceId: string): Promise<Prediction[]> {
    const raws = await this.prisma.prediction.findMany({
      where: { raceId },
    });
    return raws.map(PredictionMapper.toDomain);
  }
}