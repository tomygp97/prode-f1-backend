import { Team } from "../entities/team.entity";

export abstract class TeamRepository {
    abstract upsert(data: {
        name: string;
        colour: string;
        seasonId: string;
    }): Promise<string>;
    abstract findByName(name: string, seasonId: string): Promise<{ id: string } | null>
    abstract findAll(): Promise<Team[]>;
}