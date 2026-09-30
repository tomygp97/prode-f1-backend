import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { TeamController } from "./controllers/team.controller";
import { GetTeamsUseCase } from "../../application/teams/get-teams/get-teams.use-case";
import { TeamRepository } from "../../domain/ports/team.repository";
import { TeamPrismaRepository } from "../database/repositories/team.prisma.repository";

@Module({
    imports: [DatabaseModule],
    controllers: [TeamController],
    providers: [
        GetTeamsUseCase,
        { provide: TeamRepository, useClass: TeamPrismaRepository },
    ],
    exports: [TeamRepository],
})
export class TeamsModule{}