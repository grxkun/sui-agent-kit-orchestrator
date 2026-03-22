import { z } from 'zod';
import type { Intent } from './types.js';

const BigIntLike = z.union([
  z.bigint(),
  z.number().int().transform((v) => BigInt(v)),
  z.string().transform((v) => BigInt(v)),
]);

const AmountSchema = z.object({
  raw: BigIntLike,
  label: z.string().optional(),
});

const SlippageSchema = z.object({ bps: z.number() });
const DeadlineSchema = z.object({ minutes: z.number() });

const ProtocolLendingSchema = z.enum(['navi', 'suilend']);
const ProtocolSwapSchema = z.enum(['cetus', 'deepbook', 'auto']);

const SpotSwapSchema = z.object({
  type: z.literal('SPOT_SWAP'),
  fromCoin: z.string(),
  toCoin: z.string(),
  amountIn: AmountSchema,
  slippage: SlippageSchema,
  protocol: ProtocolSwapSchema.optional(),
  deadline: DeadlineSchema.optional(),
});

const MultiHopSwapSchema = z.object({
  type: z.literal('MULTI_HOP_SWAP'),
  route: z.array(z.string()),
  amountIn: AmountSchema,
  slippage: SlippageSchema,
});

const DepositSchema = z.object({
  type: z.literal('DEPOSIT'),
  coin: z.string(),
  amount: AmountSchema,
  protocol: ProtocolLendingSchema,
  enableCollateral: z.boolean().optional(),
});

const BorrowSchema = z.object({
  type: z.literal('BORROW'),
  coin: z.string(),
  amount: AmountSchema,
  protocol: ProtocolLendingSchema,
});

const RepaySchema = z.object({
  type: z.literal('REPAY'),
  coin: z.string(),
  amount: z.union([AmountSchema, z.literal('max')]),
  protocol: ProtocolLendingSchema,
  withdrawAfter: z.boolean().optional(),
});

const LeverageLongSchema = z.object({
  type: z.literal('LEVERAGE_LONG'),
  asset: z.string(),
  stableCoin: z.string(),
  collateralAmount: AmountSchema,
  leverageFactor: z.number(),
  slippage: SlippageSchema,
  lendingProtocol: ProtocolLendingSchema,
  swapProtocol: ProtocolSwapSchema.optional(),
});

const LeverageShortSchema = z.object({
  type: z.literal('LEVERAGE_SHORT'),
  asset: z.string(),
  stableCoin: z.string(),
  collateralAmount: AmountSchema,
  leverageFactor: z.number(),
  slippage: SlippageSchema,
  lendingProtocol: ProtocolLendingSchema,
  swapProtocol: ProtocolSwapSchema.optional(),
});

const AddLiquiditySchema = z.object({
  type: z.literal('ADD_LIQUIDITY'),
  poolId: z.string(),
  coinA: z.string(),
  coinB: z.string(),
  amountA: AmountSchema,
  amountB: AmountSchema,
  tickLower: z.number(),
  tickUpper: z.number(),
  slippage: SlippageSchema,
});

const RemoveLiquiditySchema = z.object({
  type: z.literal('REMOVE_LIQUIDITY'),
  poolId: z.string(),
  positionId: z.string(),
  percentage: z.number(),
  slippage: SlippageSchema,
});

const FlashLoanSchema = z.object({
  type: z.literal('FLASH_LOAN'),
  borrowCoin: z.string(),
  borrowAmount: AmountSchema,
  protocol: ProtocolLendingSchema,
  innerIntents: z.array(z.unknown()),
});

const ArbitrageSchema = z.object({
  type: z.literal('ARBITRAGE'),
  flashLoanCoin: z.string(),
  flashLoanAmount: AmountSchema,
  flashLoanProtocol: ProtocolLendingSchema,
  route: z.tuple([SpotSwapSchema, SpotSwapSchema]),
  minProfitRaw: BigIntLike.optional(),
});

const IntentSchema = z.discriminatedUnion('type', [
  SpotSwapSchema,
  MultiHopSwapSchema,
  DepositSchema,
  BorrowSchema,
  RepaySchema,
  LeverageLongSchema,
  LeverageShortSchema,
  AddLiquiditySchema,
  RemoveLiquiditySchema,
  FlashLoanSchema,
  ArbitrageSchema,
]);

export class IntentParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntentParseError';
  }
}

export class IntentParser {
  static parse(raw: unknown): Intent {
    const result = IntentSchema.safeParse(raw);
    if (!result.success) {
      throw new IntentParseError(
        `Invalid intent: ${result.error.issues.map((i) => i.message).join(', ')}`,
      );
    }
    return result.data as Intent;
  }

  static fromNaturalLanguage(text: string): Intent {
    const normalized = text.trim().toLowerCase();

    const swapMatch = normalized.match(
      /^swap\s+(\d+)\s+(\w+)\s+to\s+(\w+)$/,
    );
    if (swapMatch) {
      return {
        type: 'SPOT_SWAP',
        fromCoin: swapMatch[2]!.toUpperCase(),
        toCoin: swapMatch[3]!.toUpperCase(),
        amountIn: { raw: BigInt(swapMatch[1]!) },
        slippage: { bps: 100 },
      };
    }

    const depositMatch = normalized.match(
      /^deposit\s+(\d+)\s+(\w+)\s+into\s+(navi|suilend)$/,
    );
    if (depositMatch) {
      return {
        type: 'DEPOSIT',
        coin: depositMatch[2]!.toUpperCase(),
        amount: { raw: BigInt(depositMatch[1]!) },
        protocol: depositMatch[3]! as 'navi' | 'suilend',
      };
    }

    const borrowMatch = normalized.match(
      /^borrow\s+(\d+)\s+(\w+)\s+from\s+(navi|suilend)$/,
    );
    if (borrowMatch) {
      return {
        type: 'BORROW',
        coin: borrowMatch[2]!.toUpperCase(),
        amount: { raw: BigInt(borrowMatch[1]!) },
        protocol: borrowMatch[3]! as 'navi' | 'suilend',
      };
    }

    const repayMatch = normalized.match(
      /^repay\s+(\d+)\s+(\w+)\s+to\s+(navi|suilend)$/,
    );
    if (repayMatch) {
      return {
        type: 'REPAY',
        coin: repayMatch[2]!.toUpperCase(),
        amount: { raw: BigInt(repayMatch[1]!) },
        protocol: repayMatch[3]! as 'navi' | 'suilend',
      };
    }

    const leverageMatch = normalized.match(
      /^leverage\s+long\s+(\w+)\s+([\d.]+)x\s+with\s+(\d+)\s+(\w+)$/,
    );
    if (leverageMatch) {
      return {
        type: 'LEVERAGE_LONG',
        asset: leverageMatch[1]!.toUpperCase(),
        stableCoin: 'USDC',
        collateralAmount: { raw: BigInt(leverageMatch[3]!) },
        leverageFactor: parseFloat(leverageMatch[2]!),
        slippage: { bps: 100 },
        lendingProtocol: 'navi',
      };
    }

    throw new IntentParseError(
      `Could not parse natural language: "${text}"`,
    );
  }
}
