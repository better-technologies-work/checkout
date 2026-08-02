import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

const BLOCKED_PATTERNS = [
  /ignore\s+(previous|all)\s+instructions/i,
  /system\s*:\s*you\s+are/i,
  /jailbreak/i,
  /override\s+safety/i,
  /pretend\s+you\s+are/i,
  /\bDAN\b/,
  /do\s+anything\s+now/i,
];

@Injectable()
export class AiPromptShieldGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest() as any;
    const body = req.body;

    if (!body?.prompt && !body?.messages) {
      return true;
    }

    const input = typeof body.prompt === 'string'
      ? body.prompt
      : JSON.stringify(body.messages || '');

    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(input)) {
        throw new ForbiddenException({
          code: 'PROMPT_INJECTION_BLOCKED',
          message: 'Request blocked by Sovereign prompt shield.',
        });
      }
    }

    return true;
  }
}
