import { IsUUID } from 'class-validator';

export class TransferLeagueOwnershipDto {
  @IsUUID()
  newOwnerId!: string;
}