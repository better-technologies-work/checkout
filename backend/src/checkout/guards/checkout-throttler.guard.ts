import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CheckoutThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(): never {
    throw new HttpException(
      'Rate limit exceeded. Anti-carding protection activated.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
