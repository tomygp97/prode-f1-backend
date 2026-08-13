import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Season } from '../../../domain/entities/season.entity';
import { SeasonRepository } from '../../../domain/ports/season.repository';
import { SeasonMapper } from '../mappers/season.mapper';

@Injectable()
export class SeasonPrismaRepository implements SeasonRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByYear(year: number): Promise<Season | null> {
    const raw = await this.prisma.season.findUnique({ where: { year } });
    return raw ? SeasonMapper.toDomain(raw) : null;
  }
}