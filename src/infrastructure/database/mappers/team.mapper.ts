import { Team } from "../../../domain/entities/team.entity";
import { Team as PrismaTeam } from '@prisma/client';


export class TeamMapper {
    static toDomain(prismaTeam: PrismaTeam): Team {
        return Team.create({
            id: prismaTeam.id,
            name: prismaTeam.name,
            colour: prismaTeam.colour,
            seasonId: prismaTeam.seasonId,
        })
    }
}