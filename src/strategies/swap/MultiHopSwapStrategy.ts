import { BaseStrategy } from '../BaseStrategy.js';
import { PTBBuilder } from '../../ptb/PTBBuilder.js';
import { CoinManager } from '../../ptb/CoinManager.js';
import { SlippageCalculator } from '../../ptb/SlippageCalculator.js';
import type { MultiHopSwapIntent } from '../../intents/types.js';
import type { BuildContext, BuiltPTB, CoinRef } from '../../ptb/types.js';
import type { ProtocolRegistry } from '../../protocols/ProtocolRegistry.js';

export class MultiHopSwapStrategy extends BaseStrategy<MultiHopSwapIntent> {
  readonly name = 'MultiHopSwapStrategy' as const;
  readonly intentType = 'MULTI_HOP_SWAP' as const;

  build(intent: MultiHopSwapIntent, ctx: BuildContext, registry: ProtocolRegistry): BuiltPTB {
    const builder = new PTBBuilder();
    const tx = builder.getTransaction();
    const coinManager = new CoinManager();

    if (intent.route.length < 2) {
      throw new Error('Multi-hop swap requires at least 2 tokens in the route');
    }

    const adapter = registry.get('cetus');
    if (!adapter.swap) {
      throw new Error("Protocol 'cetus' does not support swap");
    }

    let currentCoin: CoinRef = coinManager.splitCoin(tx, intent.route[0], intent.amountIn.raw);

    for (let i = 0; i < intent.route.length - 1; i++) {
      const toCoinType = intent.route[i + 1];
      const minOut = SlippageCalculator.applySlippage(currentCoin.amount, intent.slippage.bps);

      currentCoin = adapter.swap(tx, ctx, {
        fromCoin: currentCoin,
        toCoinType,
        minOut,
      });
    }

    builder.addProtocol(adapter.name);
    builder.addSummary(
      `Multi-hop swap ${intent.route.join(' → ')} via ${adapter.name}`,
    );

    return builder.build();
  }
}
