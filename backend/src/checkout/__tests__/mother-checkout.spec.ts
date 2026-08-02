import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutService } from '../checkout.service';
import { PrismaService } from '../../prisma/prisma.service';
import Decimal from 'decimal.js';

describe('MotherCheckoutQuanta - ACID Fiscalization', () => {
  let service: CheckoutService;
  let prisma: PrismaService;

  const mockPrisma = {
    $transaction: jest.fn(),
    childQuanto: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    checkoutTransaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Prisma Transaction & Rollback', () => {
    it('should execute atomic transaction via prisma.$transaction', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          childQuanto: {
            findUnique: jest.fn().mockResolvedValue({
              quantaHash: 'test-hash',
              stockAvailable: 10,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          checkoutTransaction: {
            create: jest.fn().mockResolvedValue({
              txHash: 'test-tx-hash',
              productQuantaHash: 'test-hash',
              total: '100.0000',
              status: 'COMPLETED',
              createdAt: new Date(),
            }),
          },
        };
        return fn(tx);
      });

      const result = await service.processCheckout({
        productQuantaHash: 'test-hash',
        idempotencyKey: 'test-idempotency-key',
        amount: 100,
        currency: 'USD',
        tax: 0,
        fee: 0,
      });

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.txHash).toBeDefined();
    });

    it('should rollback on stock insufficient error', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          childQuanto: {
            findUnique: jest.fn().mockResolvedValue({
              quantaHash: 'test-hash',
              stockAvailable: 0,
            }),
            update: jest.fn(),
          },
          checkoutTransaction: {
            create: jest.fn(),
          },
        };
        return fn(tx);
      });

      await expect(
        service.processCheckout({
          productQuantaHash: 'test-hash',
          idempotencyKey: 'test-idempotency-key-2',
          amount: 100,
          currency: 'USD',
          tax: 0,
          fee: 0,
        }),
      ).rejects.toThrow('Insufficient stock');
    });

    it('should rollback on product not found', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          childQuanto: {
            findUnique: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
          },
          checkoutTransaction: {
            create: jest.fn(),
          },
        };
        return fn(tx);
      });

      await expect(
        service.processCheckout({
          productQuantaHash: 'nonexistent-hash',
          idempotencyKey: 'test-idempotency-key-3',
          amount: 100,
          currency: 'USD',
          tax: 0,
          fee: 0,
        }),
      ).rejects.toThrow('Product not found');
    });
  });

  describe('Decimal Precision', () => {
    it('should calculate total with exact 4-decimal precision', () => {
      const amount = new Decimal('19.99');
      const tax = new Decimal('1.60');
      const fee = new Decimal('0.50');
      const total = amount.plus(tax).plus(fee);

      expect(total.toFixed(4)).toBe('22.0900');
      expect(total.toFixed(4)).not.toContain('22.090000000001');
    });

    it('should not have floating point drift', () => {
      const a = new Decimal('0.1');
      const b = new Decimal('0.2');
      const result = a.plus(b);

      expect(result.toFixed(4)).toBe('0.3000');
      expect(result.toFixed(4)).not.toBe('0.30000000000000004');
    });

    it('should handle large monetary values without precision loss', () => {
      const amount = new Decimal('999999.9999');
      const tax = new Decimal('89999.9999');
      const total = amount.plus(tax);

      expect(total.toFixed(4)).toBe('1089999.9998');
    });

    it('should handle zero values correctly', () => {
      const amount = new Decimal('0');
      const tax = new Decimal('0');
      const fee = new Decimal('0');
      const total = amount.plus(tax).plus(fee);

      expect(total.toFixed(4)).toBe('0.0000');
    });
  });

  describe('Idempotency', () => {
    const mockProduct = {
      quantaHash: 'idem-hash-1',
      stockAvailable: 10,
    };

    beforeEach(() => {
      mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          childQuanto: {
            findUnique: jest.fn().mockResolvedValue(mockProduct),
            update: jest.fn().mockResolvedValue({}),
          },
          checkoutTransaction: {
            create: jest.fn().mockResolvedValue({
              txHash: 'test-tx-hash-idem',
              productQuantaHash: 'idem-hash-1',
              total: '50.0000',
              status: 'COMPLETED',
              createdAt: new Date(),
            }),
          },
        };
        return fn(tx);
      });
    });

    it('should return cached response for duplicate idempotencyKey', async () => {
      const firstCall = await service.processCheckout({
        productQuantaHash: 'idem-hash-1',
        idempotencyKey: 'unique-idem-key-1',
        amount: 50,
        currency: 'USD',
        tax: 0,
        fee: 0,
      });

      const secondCall = await service.processCheckout({
        productQuantaHash: 'idem-hash-1',
        idempotencyKey: 'unique-idem-key-1',
        amount: 50,
        currency: 'USD',
        tax: 0,
        fee: 0,
      });

      expect(firstCall.txHash).toBe(secondCall.txHash);
      expect(firstCall.success).toBe(true);
      expect(secondCall.success).toBe(true);
    });

    it('should not execute transaction twice for same idempotencyKey', async () => {
      await service.processCheckout({
        productQuantaHash: 'idem-hash-2',
        idempotencyKey: 'unique-idem-key-2',
        amount: 100,
        currency: 'USD',
        tax: 0,
        fee: 0,
      });

      await service.processCheckout({
        productQuantaHash: 'idem-hash-2',
        idempotencyKey: 'unique-idem-key-2',
        amount: 100,
        currency: 'USD',
        tax: 0,
        fee: 0,
      });

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});
