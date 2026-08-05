import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PredictionScore } from '../../../domain/entities/prediction-score.entity';
import { PredictionScoreRepository } from '../../../domain/ports/prediction-score.repository';
import { PredictionScoreMapper } from '../mappers/prediction-score.mapper';

@Injectable()
export class PredictionScorePrismaRepository implements PredictionScoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(score: PredictionScore): Promise<void> {
    const data = PredictionScoreMapper.toPersistence(score);
    await this.prisma.predictionScore.upsert({
      where: { id: score.id },
      create: data,
      update: data,
    });
  }

  async findByPredictionId(predictionId: string): Promise<PredictionScore | null> {
    const raw = await this.prisma.predictionScore.findUnique({
      where: { predictionId },
    });
    return raw ? PredictionScoreMapper.toDomain(raw) : null;
  }
}