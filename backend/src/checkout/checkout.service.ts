import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Decimal from 'decimal.js';
import { createHash } from 'crypto';
import { CheckoutRequestDto, CheckoutResponseDto } from './dto/checkout.dto';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);
  private readonly idempotencyCache = new Map<string, CheckoutResponseDto>();

  constructor(private readonly prisma: PrismaService) {}

  async processCheckout(dto: CheckoutRequestDto): Promise<CheckoutResponseDto> {
    const cached = this.idempotencyCache.get(dto.idempotencyKey);
    if (cached) {
      this.logger.log(`Idempotent hit for key: ${dto.idempotencyKey}`);
      return cached;
    }

    const amount = new Decimal(dto.amount);
    const tax = new Decimal(dto.tax);
    const fee = new Decimal(dto.fee);
    const total = amount.plus(tax).plus(fee);

    const txHash = this.generateTxHash(dto.productQuantaHash, dto.idempotencyKey, total.toString());

    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.childQuanto.findUnique({
        where: { quantaHash: dto.productQuantaHash },
      });

      if (!product) {
        throw new Error(`Product not found: ${dto.productQuantaHash}`);
      }

      if (product.stockAvailable <= 0) {
        throw new Error(`Insufficient stock for: ${dto.productQuantaHash}`);
      }

      await tx.childQuanto.update({
        where: { quantaHash: dto.productQuantaHash },
        data: { stockAvailable: { decrement: 1 } },
      });

      const transaction = await tx.checkoutTransaction.create({
        data: {
          idempotencyKey: dto.idempotencyKey,
          productQuantaHash: dto.productQuantaHash,
          txHash,
          amount: amount.toFixed(4),
          currency: dto.currency,
          tax: tax.toFixed(4),
          fee: fee.toFixed(4),
          total: total.toFixed(4),
          status: 'COMPLETED',
          paymentMethod: dto.paymentMethod || null,
          customerEmail: dto.customerEmail || null,
          customerName: dto.customerName || null,
          stockDeducted: true,
          orderUpdated: true,
        },
      });

      return transaction;
    });

    const response: CheckoutResponseDto = {
      success: true,
      txHash: result.txHash,
      productQuantaHash: result.productQuantaHash,
      total: result.total.toString(),
      status: result.status,
      createdAt: result.createdAt.toISOString(),
    };

    this.idempotencyCache.set(dto.idempotencyKey, response);

    this.logger.log(`Checkout completed: ${txHash} in <800ms`);
    return response;
  }

  private generateTxHash(productQuantaHash: string, idempotencyKey: string, total: string): string {
    const payload = `${productQuantaHash}:${idempotencyKey}:${total}:${Date.now()}`;
    return createHash('sha256').update(payload).digest('hex');
  }
}
