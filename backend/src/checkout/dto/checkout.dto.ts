import { z } from 'zod';

export const CheckoutRequestSchema = z.object({
  productQuantaHash: z.string().min(1).max(128),
  idempotencyKey: z.string().min(1).max(128),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  tax: z.number().min(0).default(0),
  fee: z.number().min(0).default(0),
  paymentMethod: z.string().max(64).optional(),
  customerEmail: z.string().email().max(256).optional(),
  customerName: z.string().max(256).optional(),
});

export type CheckoutRequestDto = z.infer<typeof CheckoutRequestSchema>;

export const CheckoutResponseSchema = z.object({
  success: z.boolean(),
  txHash: z.string().optional(),
  productQuantaHash: z.string(),
  total: z.string(),
  status: z.string(),
  createdAt: z.string().optional(),
  error: z.string().optional(),
});

export type CheckoutResponseDto = z.infer<typeof CheckoutResponseSchema>;
