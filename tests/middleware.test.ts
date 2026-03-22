import { describe, it, expect, vi } from 'vitest';
import { OrchestratorMiddleware } from '../src/middleware/OrchestratorMiddleware.js';

describe('OrchestratorMiddleware', () => {
  it('should execute a spot swap intent', async () => {
    const executor = vi.fn().mockResolvedValue('0xdigest123');
    const onBuilt = vi.fn();
    const onExecuted = vi.fn();

    const orchestrator = new OrchestratorMiddleware({
      rpcUrl: 'https://fullnode.testnet.sui.io:443',
      network: 'testnet',
      senderAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      executor,
      onBuilt,
      onExecuted,
    });

    const result = await orchestrator.execute({
      type: 'SPOT_SWAP',
      fromCoin: '0x2::sui::SUI',
      toCoin: 'USDC',
      amountIn: { raw: 1000000000 },
      slippage: { bps: 50 },
    });

    expect(result.txDigest).toBe('0xdigest123');
    expect(result.intent.type).toBe('SPOT_SWAP');
    expect(executor).toHaveBeenCalledOnce();
    expect(onBuilt).toHaveBeenCalledOnce();
    expect(onExecuted).toHaveBeenCalledOnce();
  });

  it('should reject invalid intents', async () => {
    const orchestrator = new OrchestratorMiddleware({
      rpcUrl: 'https://fullnode.testnet.sui.io:443',
      network: 'testnet',
      senderAddress: '0x1234',
      executor: vi.fn(),
    });

    await expect(orchestrator.execute({ type: 'INVALID' })).rejects.toThrow();
  });

  it('should block when policy middleware blocks', async () => {
    const orchestrator = new OrchestratorMiddleware({
      rpcUrl: 'https://fullnode.testnet.sui.io:443',
      network: 'testnet',
      senderAddress: '0x1234',
      executor: vi.fn(),
      policyMiddleware: {
        verify: async () => ({ status: 'BLOCK' as const }),
      },
    });

    await expect(orchestrator.execute({
      type: 'SPOT_SWAP',
      fromCoin: 'SUI',
      toCoin: 'USDC',
      amountIn: { raw: 1000000000 },
      slippage: { bps: 50 },
    })).rejects.toThrow('blocked by policy');
  });

  it('should list registered protocols', () => {
    const orchestrator = new OrchestratorMiddleware({
      rpcUrl: 'https://fullnode.testnet.sui.io:443',
      network: 'testnet',
      senderAddress: '0x1234',
      executor: vi.fn(),
    });

    const protocols = orchestrator.getProtocolRegistry().list();
    expect(protocols).toContain('cetus');
    expect(protocols).toContain('navi');
    expect(protocols).toContain('suilend');
    expect(protocols).toContain('deepbook');
  });

  it('should list registered strategies', () => {
    const orchestrator = new OrchestratorMiddleware({
      rpcUrl: 'https://fullnode.testnet.sui.io:443',
      network: 'testnet',
      senderAddress: '0x1234',
      executor: vi.fn(),
    });

    const strategies = orchestrator.getStrategyRegistry().list();
    expect(strategies).toContain('SpotSwapStrategy');
    expect(strategies).toContain('DepositStrategy');
    expect(strategies).toContain('ArbitrageStrategy');
  });
});
