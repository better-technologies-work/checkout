import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';

const COST_LIMIT_USD = 0.50;

interface CostWindow {
  totalCost: number;
  requestCount: number;
  windowStart: number;
}

@Injectable()
export class AiCostCircuitGuard implements CanActivate {
  private windows = new Map<string, CostWindow>();
  private readonly WINDOW_MS = 60_000;

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest() as any;
    const userId = req['user']?.id || req.headers['x-user-id'] || 'anonymous';
    const now = Date.now();

    let window = this.windows.get(userId as string);

    if (!window || now - window.windowStart > this.WINDOW_MS) {
      window = { totalCost: 0, requestCount: 0, windowStart: now };
      this.windows.set(userId as string, window);
    }

    const estimatedCost = req.body?.estimatedCost || 0;

    if (window.totalCost + estimatedCost > COST_LIMIT_USD) {
      throw new HttpException(
        {
          code: 'AI_COST_CIRCUIT_BREAKER',
          message: `Cost limit of $${COST_LIMIT_USD} exceeded for current window.`,
          limit: COST_LIMIT_USD,
          current: window.totalCost,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    window.totalCost += estimatedCost;
    window.requestCount++;

    return true;
  }
}
