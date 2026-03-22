import { OrchestratorMiddleware } from '../src/middleware/OrchestratorMiddleware.js';
import type { BuiltPTB } from '../src/ptb/types.js';

async function main() {
  const orchestrator = new OrchestratorMiddleware({
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
    network: 'testnet',
    senderAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    executor: async (ptb: BuiltPTB) => {
      console.log('Would execute with summary:', ptb.summary);
      console.log('Protocols used:', ptb.protocols);
      return '0xmock_digest';
    },
  });

  // Deposit into Navi
  console.log('\n--- Deposit into Navi ---');
  await orchestrator.execute({
    type: 'DEPOSIT',
    coin: '0x2::sui::SUI',
    amount: { raw: 5_000_000_000 },
    protocol: 'navi',
    enableCollateral: true,
  });

  // Borrow from Navi
  console.log('\n--- Borrow USDC from Navi ---');
  await orchestrator.execute({
    type: 'BORROW',
    coin: 'USDC',
    amount: { raw: 100_000_000 },
    protocol: 'navi',
  });

  // Swap on Cetus
  console.log('\n--- Swap USDC to SUI on Cetus ---');
  await orchestrator.execute({
    type: 'SPOT_SWAP',
    fromCoin: 'USDC',
    toCoin: 'SUI',
    amountIn: { raw: 50_000_000 },
    slippage: { bps: 50 },
    protocol: 'cetus',
  });

  console.log('\nAll operations completed!');
}

main().catch(console.error);
