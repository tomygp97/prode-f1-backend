import { Injectable } from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { InviteCodeGenerator } from '../../domain/ports/invite-code-generator';

const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);
// alfabeto sin 0, O, 1, I — para evitar confusión visual al compartir el código

@Injectable()
export class NanoIdInviteCodeGenerator implements InviteCodeGenerator {
  generate(): string {
    return generateCode();
  }
}