import { Controller, Post, Body, HttpCode, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutRequestSchema, CheckoutRequestDto } from './dto/checkout.dto';
import { CheckoutThrottlerGuard } from './guards/checkout-throttler.guard';

@Controller('checkout')
export class CheckoutController {
  private readonly logger = new Logger(CheckoutController.name);

  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(CheckoutThrottlerGuard)
  async processCheckout(@Body() body: unknown) {
    const startTime = Date.now();

    const parsed = CheckoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      this.logger.warn(`Validation failed: ${parsed.error.message}`);
      return {
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      };
    }

    try {
      const result = await this.checkoutService.processCheckout(parsed.data);
      const elapsed = Date.now() - startTime;
      this.logger.log(`Checkout processed in ${elapsed}ms`);
      return result;
    } catch (error) {
      this.logger.error(`Checkout failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        productQuantaHash: parsed.data.productQuantaHash,
      };
    }
  }
}
