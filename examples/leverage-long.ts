import { OrchestratorMiddleware } from '../src/middleware/OrchestratorMiddleware.js';
import type { BuiltPTB } from '../src/ptb/types.js';

async function main() {
  const orchestrator = new OrchestratorMiddleware({
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
    network: 'testnet',
    senderAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    executor: async (ptb: BuiltPTB) => {
      console.log('Would execute leverage long with summary:', ptb.summary);
      return '0xmock_digest';
    },
  });

  const result = await orchestrator.execute({
    type: 'LEVERAGE_LONG',
    asset: '0x2::sui::SUI',
    stableCoin: 'USDC',
    collateralAmount: { raw: 10_000_000_000 },
    leverageFactor: 2,
    slippage: { bps: 100 },
    lendingProtocol: 'navi',
    swapProtocol: 'cetus',
  });

  console.log('Result:', { txDigest: result.txDigest });
}

main().catch(console.error);
