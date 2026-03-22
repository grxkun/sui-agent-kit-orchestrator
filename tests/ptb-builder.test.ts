import { describe, it, expect } from 'vitest';
import { PTBBuilder } from '../src/ptb/PTBBuilder.js';
import { SlippageCalculator } from '../src/ptb/SlippageCalculator.js';

describe('PTBBuilder', () => {
  it('should build a BuiltPTB with summary and protocols', () => {
    const builder = new PTBBuilder();
    builder.addSummary('Swap SUI → USDC');
    builder.addProtocol('cetus');
    const ptb = builder.build(5_000_000n);
    expect(ptb.summary).toEqual(['Swap SUI → USDC']);
    expect(ptb.protocols).toEqual(['cetus']);
    expect(ptb.estimatedGasMist).toBe(5_000_000n);
  });

  it('should use default gas estimate', () => {
    const builder = new PTBBuilder();
    const ptb = builder.build();
    expect(ptb.estimatedGasMist).toBe(10_000_000n);
  });
});

describe('SlippageCalculator', () => {
  it('should apply slippage correctly', () => {
    expect(SlippageCalculator.applySlippage(1000n, 50)).toBe(995n);
  });

  it('should add slippage correctly', () => {
    expect(SlippageCalculator.addSlippage(1000n, 50)).toBe(1005n);
  });

  it('should handle zero slippage', () => {
    expect(SlippageCalculator.applySlippage(1000n, 0)).toBe(1000n);
  });

  it('should handle 100% slippage', () => {
    expect(SlippageCalculator.applySlippage(1000n, 10000)).toBe(0n);
  });
});
