import { describe, it, expect } from 'vitest';
import { IntentParser, IntentParseError } from '../src/intents/IntentParser.js';
import { IntentValidator } from '../src/intents/IntentValidator.js';
import { IntentRouter } from '../src/intents/IntentRouter.js';

describe('IntentParser', () => {
  describe('parse', () => {
    it('should parse a valid SpotSwapIntent', () => {
      const raw = {
        type: 'SPOT_SWAP',
        fromCoin: '0x2::sui::SUI',
        toCoin: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
        amountIn: { raw: 1000000000 },
        slippage: { bps: 50 },
      };
      const intent = IntentParser.parse(raw);
      expect(intent.type).toBe('SPOT_SWAP');
    });

    it('should parse a valid DepositIntent', () => {
      const raw = {
        type: 'DEPOSIT',
        coin: '0x2::sui::SUI',
        amount: { raw: 5000000000 },
        protocol: 'navi',
        enableCollateral: true,
      };
      const intent = IntentParser.parse(raw);
      expect(intent.type).toBe('DEPOSIT');
    });

    it('should throw IntentParseError for invalid input', () => {
      expect(() => IntentParser.parse({ type: 'INVALID' })).toThrow(IntentParseError);
    });

    it('should throw IntentParseError for missing fields', () => {
      expect(() => IntentParser.parse({ type: 'SPOT_SWAP' })).toThrow(IntentParseError);
    });
  });

  describe('fromNaturalLanguage', () => {
    it('should parse "swap 100 SUI to USDC"', () => {
      const intent = IntentParser.fromNaturalLanguage('swap 100 SUI to USDC');
      expect(intent.type).toBe('SPOT_SWAP');
    });

    it('should parse "deposit 500 SUI into navi"', () => {
      const intent = IntentParser.fromNaturalLanguage('deposit 500 SUI into navi');
      expect(intent.type).toBe('DEPOSIT');
    });

    it('should throw on unrecognized text', () => {
      expect(() => IntentParser.fromNaturalLanguage('hello world')).toThrow();
    });
  });
});

describe('IntentValidator', () => {
  it('should validate a correct SpotSwapIntent', () => {
    const intent = IntentParser.parse({
      type: 'SPOT_SWAP',
      fromCoin: 'SUI',
      toCoin: 'USDC',
      amountIn: { raw: 1000000000 },
      slippage: { bps: 50 },
    });
    const result = IntentValidator.validate(intent);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject negative slippage', () => {
    const intent = {
      type: 'SPOT_SWAP' as const,
      fromCoin: 'SUI',
      toCoin: 'USDC',
      amountIn: { raw: 1000000000n },
      slippage: { bps: -1 },
    };
    const result = IntentValidator.validate(intent);
    expect(result.valid).toBe(false);
  });

  it('should reject excessive slippage', () => {
    const intent = {
      type: 'SPOT_SWAP' as const,
      fromCoin: 'SUI',
      toCoin: 'USDC',
      amountIn: { raw: 1000000000n },
      slippage: { bps: 6000 },
    };
    const result = IntentValidator.validate(intent);
    expect(result.valid).toBe(false);
  });
});

describe('IntentRouter', () => {
  it('should route SPOT_SWAP to SpotSwapStrategy', () => {
    const intent = IntentParser.parse({
      type: 'SPOT_SWAP',
      fromCoin: 'SUI',
      toCoin: 'USDC',
      amountIn: { raw: 1000000000 },
      slippage: { bps: 50 },
    });
    expect(IntentRouter.route(intent)).toBe('SpotSwapStrategy');
  });

  it('should route DEPOSIT to DepositStrategy', () => {
    const intent = IntentParser.parse({
      type: 'DEPOSIT',
      coin: 'SUI',
      amount: { raw: 5000000000 },
      protocol: 'navi',
    });
    expect(IntentRouter.route(intent)).toBe('DepositStrategy');
  });

  it('should route all intent types', () => {
    const routes: Record<string, string> = {
      'SPOT_SWAP': 'SpotSwapStrategy',
      'MULTI_HOP_SWAP': 'MultiHopSwapStrategy',
      'DEPOSIT': 'DepositStrategy',
      'BORROW': 'BorrowStrategy',
      'REPAY': 'RepayStrategy',
      'LEVERAGE_LONG': 'LeverageLongStrategy',
      'LEVERAGE_SHORT': 'LeverageShortStrategy',
      'ADD_LIQUIDITY': 'AddLiquidityStrategy',
      'REMOVE_LIQUIDITY': 'RemoveLiquidityStrategy',
      'FLASH_LOAN': 'FlashLoanStrategy',
      'ARBITRAGE': 'ArbitrageStrategy',
    };
    for (const [type, strategy] of Object.entries(routes)) {
      expect(IntentRouter.route({ type } as any)).toBe(strategy);
    }
  });
});
