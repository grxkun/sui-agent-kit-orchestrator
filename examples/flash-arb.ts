import { OrchestratorMiddleware } from '../src/middleware/OrchestratorMiddleware.js';
import type { BuiltPTB } from '../src/ptb/types.js';

async function main() {
  const orchestrator = new OrchestratorMiddleware({
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
    network: 'testnet',
    senderAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    executor: async (ptb: BuiltPTB) => {
      console.log('Would execute flash arb with summary:', ptb.summary);
      return '0xmock_digest';
    },
  });

  const result = await orchestrator.execute({
    type: 'ARBITRAGE',
    flashLoanCoin: 'USDC',
    flashLoanAmount: { raw: 100_000_000_000 },
    flashLoanProtocol: 'navi',
    route: [
      { type: 'SPOT_SWAP', fromCoin: 'USDC', toCoin: 'SUI', amountIn: { raw: 100_000_000_000 }, slippage: { bps: 50 }, protocol: 'cetus' },
      { type: 'SPOT_SWAP', fromCoin: 'SUI', toCoin: 'USDC', amountIn: { raw: 100_000_000_000 }, slippage: { bps: 50 }, protocol: 'deepbook' },
    ],
    minProfitRaw: 1_000_000,
  });

  console.log('Result:', { txDigest: result.txDigest });
}

main().catch(console.error);
