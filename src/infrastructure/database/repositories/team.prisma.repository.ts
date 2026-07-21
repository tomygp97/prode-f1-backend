import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeamRepository } from '../../../domain/ports/team.repository';

@Injectable()
export class TeamPrismaRepository implements TeamRepository {

    constructor(private readonly prisma: PrismaService) {}

    async upsert(data: { name: string; colour: string; seasonId: string; }): Promise<string> {
        const team = await this.prisma.team.upsert({

            where: { name_seasonId: { name: data.name, seasonId: data.seasonId } },
            create: {
                name: data.name,
                colour: data.colour,
                seasonId: data.seasonId,
            },
            update: {
                colour: data.colour,
            },
        });
        return team.id;
    }

    async findByName(name: string, seasonId: string): Promise<{ id: string } | null> {
        return this.prisma.team.findUnique({
          where: { name_seasonId: { name, seasonId } },
          select: { id: true },
        });
      }
}