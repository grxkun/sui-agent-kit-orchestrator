import { OrchestratorMiddleware } from '../src/middleware/OrchestratorMiddleware.js';
import type { BuiltPTB } from '../src/ptb/types.js';

async function main() {
  const orchestrator = new OrchestratorMiddleware({
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
    network: 'testnet',
    senderAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    executor: async (ptb: BuiltPTB) => {
      console.log('Would execute transaction with summary:', ptb.summary);
      return '0xmock_digest';
    },
    onBuilt: (ptb, intent) => console.log(`Built ${intent.type} using protocols: ${ptb.protocols.join(', ')}`),
    onExecuted: (digest, intent) => console.log(`Executed ${intent.type}: ${digest}`),
  });

  const result = await orchestrator.execute({
    type: 'SPOT_SWAP',
    fromCoin: '0x2::sui::SUI',
    toCoin: 'USDC',
    amountIn: { raw: 1_000_000_000 },
    slippage: { bps: 50 },
    protocol: 'cetus',
  });

  console.log('Result:', { txDigest: result.txDigest, executedAt: new Date(result.executedAt) });
}

main().catch(console.error);
