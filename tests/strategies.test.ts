import { describe, it, expect } from 'vitest';
import { ProtocolRegistry } from '../src/protocols/ProtocolRegistry.js';
import { CetusAdapter } from '../src/protocols/cetus/CetusAdapter.js';
import { NaviAdapter } from '../src/protocols/navi/NaviAdapter.js';
import { DeepBookAdapter } from '../src/protocols/deepbook/DeepBookAdapter.js';
import { SuilendAdapter } from '../src/protocols/suilend/SuilendAdapter.js';
import { SpotSwapStrategy } from '../src/strategies/swap/SpotSwapStrategy.js';
import { DepositStrategy } from '../src/strategies/lending/DepositStrategy.js';
import { BorrowStrategy } from '../src/strategies/lending/BorrowStrategy.js';
import type { BuildContext } from '../src/ptb/types.js';

function createTestContext(): BuildContext {
  return {
    client: {} as any,
    sender: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    network: 'testnet',
  };
}

function createTestRegistry(): ProtocolRegistry {
  const registry = new ProtocolRegistry();
  registry.register(new CetusAdapter());
  registry.register(new NaviAdapter());
  registry.register(new SuilendAdapter());
  registry.register(new DeepBookAdapter());
  return registry;
}

describe('SpotSwapStrategy', () => {
  it('should build a swap PTB', () => {
    const strategy = new SpotSwapStrategy();
    const ptb = strategy.build(
      {
        type: 'SPOT_SWAP',
        fromCoin: '0x2::sui::SUI',
        toCoin: 'USDC',
        amountIn: { raw: 1000000000n },
        slippage: { bps: 50 },
      },
      createTestContext(),
      createTestRegistry(),
    );
    expect(ptb.summary.length).toBeGreaterThan(0);
    expect(ptb.protocols).toContain('cetus');
  });
});

describe('DepositStrategy', () => {
  it('should build a deposit PTB', () => {
    const strategy = new DepositStrategy();
    const ptb = strategy.build(
      {
        type: 'DEPOSIT',
        coin: '0x2::sui::SUI',
        amount: { raw: 5000000000n },
        protocol: 'navi',
        enableCollateral: true,
      },
      createTestContext(),
      createTestRegistry(),
    );
    expect(ptb.summary.length).toBeGreaterThan(0);
    expect(ptb.protocols).toContain('navi');
  });
});

describe('BorrowStrategy', () => {
  it('should build a borrow PTB', () => {
    const strategy = new BorrowStrategy();
    const ptb = strategy.build(
      {
        type: 'BORROW',
        coin: 'USDC',
        amount: { raw: 100000000n },
        protocol: 'navi',
      },
      createTestContext(),
      createTestRegistry(),
    );
    expect(ptb.summary.length).toBeGreaterThan(0);
    expect(ptb.protocols).toContain('navi');
  });
});
