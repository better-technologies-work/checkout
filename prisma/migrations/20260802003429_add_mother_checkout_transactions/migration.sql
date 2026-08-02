-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'oauth',
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "traceHash" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "costUsd" DECIMAL(19,4) NOT NULL,
    "model" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuantoMother" (
    "id" UUID NOT NULL,
    "motherCode" VARCHAR(64) NOT NULL,
    "version" TEXT NOT NULL DEFAULT '3.2.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuantoMother_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildQuanto" (
    "id" UUID NOT NULL,
    "quantaHash" VARCHAR(128) NOT NULL,
    "parentHash" VARCHAR(128),
    "motherId" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "isHead" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "priceDecimal" DECIMAL(19,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "stockAvailable" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildQuanto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckoutTransaction" (
    "id" UUID NOT NULL,
    "idempotencyKey" VARCHAR(128) NOT NULL,
    "productQuantaHash" VARCHAR(128) NOT NULL,
    "txHash" VARCHAR(256) NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "tax" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "fee" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(19,4) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "paymentMethod" VARCHAR(64),
    "gatewayResponse" JSONB,
    "customerEmail" VARCHAR(256),
    "customerName" VARCHAR(256),
    "stockDeducted" BOOLEAN NOT NULL DEFAULT false,
    "orderUpdated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "AiUsageLog_traceHash_key" ON "AiUsageLog"("traceHash");

-- CreateIndex
CREATE UNIQUE INDEX "QuantoMother_motherCode_key" ON "QuantoMother"("motherCode");

-- CreateIndex
CREATE UNIQUE INDEX "ChildQuanto_quantaHash_key" ON "ChildQuanto"("quantaHash");

-- CreateIndex
CREATE INDEX "ChildQuanto_quantaHash_idx" ON "ChildQuanto"("quantaHash");

-- CreateIndex
CREATE INDEX "ChildQuanto_ownerId_idx" ON "ChildQuanto"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutTransaction_idempotencyKey_key" ON "CheckoutTransaction"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutTransaction_txHash_key" ON "CheckoutTransaction"("txHash");

-- CreateIndex
CREATE INDEX "CheckoutTransaction_productQuantaHash_idx" ON "CheckoutTransaction"("productQuantaHash");

-- CreateIndex
CREATE INDEX "CheckoutTransaction_status_idx" ON "CheckoutTransaction"("status");

-- CreateIndex
CREATE INDEX "CheckoutTransaction_createdAt_idx" ON "CheckoutTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsageLog" ADD CONSTRAINT "AiUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildQuanto" ADD CONSTRAINT "ChildQuanto_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "QuantoMother"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
