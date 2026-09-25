import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

export class JoinLeagueDto {
  // Los códigos son 6 caracteres en mayúscula: " amigos " también sirve
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @Length(6, 6)
  inviteCode!: string;
}
