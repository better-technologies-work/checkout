# MotherCheckoutQuanta - Engine Documentation

> Alpha OS v3.2 - Célula Comercial Financiera

## Overview

MotherCheckoutQuanta is the ACID processor for the Alpha OS checkout flow. It receives product data from LiveEdgeQuanta, processes payment atomically, and emits downstream triggers.

## Architecture

```
LiveEdgeQuanta (Entry) → MotherCheckoutQuanta (ACID Engine) → Downstream Triggers
```

## Public Endpoints

### POST `/api/checkout`

Processes a checkout transaction with idempotency protection.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productQuantaHash` | string(128) | Yes | Product identifier hash |
| `idempotencyKey` | string(128) | Yes | Unique key for idempotency |
| `amount` | number | Yes | Base amount (Decimal(19,4)) |
| `currency` | string(3) | No | Currency code (default: USD) |
| `tax` | number | No | Tax amount |
| `fee` | number | No | Processing fee |
| `paymentMethod` | string(64) | No | Payment method identifier |
| `customerEmail` | string(256) | No | Customer email |
| `customerName` | string(256) | No | Customer name |

**Response (Success):**

```json
{
  "success": true,
  "txHash": "sha256-hash",
  "productQuantaHash": "product-hash",
  "total": "100.0000",
  "status": "COMPLETED",
  "createdAt": "2026-08-01T20:00:00.000Z"
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "Error message",
  "productQuantaHash": "product-hash"
}
```

## Atomic Calculation Rules

1. **Total = Amount + Tax + Fee** (all using Decimal(19,4))
2. **Precision**: All monetary fields use `Decimal(19,4)` in Prisma and `decimal.js` in service
3. **No Float**: JavaScript `Number` or `Float` types are PROHIBITED for monetary values

## Idempotency (Layer 0 Deterministic)

- Duplicate `idempotencyKey` returns cached response in <100ms
- No database re-execution on duplicates
- Cache stored in memory (Map)

## Transaction Hash (txHash)

- Generated as SHA-256 of `{productQuantaHash}:{idempotencyKey}:{total}:{timestamp}`
- Immutable audit record linked to `productQuantaHash`
- Stored in `CheckoutTransaction` table

## Rate Limiting

- **Throttler**: 10 requests per 60-second window
- **Anti-carding**: Blocks excessive requests from single source
- Returns HTTP 429 on limit exceeded

## Database Schema (CheckoutTransaction)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `idempotencyKey` | VARCHAR(128) | Unique idempotency key |
| `productQuantaHash` | VARCHAR(128) | Product hash |
| `txHash` | VARCHAR(256) | Immutable transaction hash |
| `amount` | Decimal(19,4) | Base amount |
| `currency` | VARCHAR(3) | Currency code |
| `tax` | Decimal(19,4) | Tax amount |
| `fee` | Decimal(19,4) | Processing fee |
| `total` | Decimal(19,4) | Total amount |
| `status` | VARCHAR(32) | Transaction status |
| `stockDeducted` | Boolean | Stock deduction flag |
| `orderUpdated` | Boolean | Order update flag |

## Verification Guide

To verify a transaction by `txHash`:

```sql
SELECT * FROM "CheckoutTransaction" WHERE "txHash" = '<hash>';
```

To verify by `productQuantaHash`:

```sql
SELECT * FROM "CheckoutTransaction" WHERE "productQuantaHash" = '<hash>' ORDER BY "createdAt" DESC;
```
