import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class TraceHashMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const traceId = randomBytes(16).toString('hex');
    const traceHash = createHash('sha256')
      .update(`${traceId}-${Date.now()}-${req.originalUrl}`)
      .digest('hex');

    req['traceHash'] = traceHash;
    res.setHeader('X-Trace-Hash', traceHash);

    next();
  }
}
