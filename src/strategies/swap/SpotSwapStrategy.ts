import { BaseStrategy } from '../BaseStrategy.js';
import { PTBBuilder } from '../../ptb/PTBBuilder.js';
import { CoinManager } from '../../ptb/CoinManager.js';
import { SlippageCalculator } from '../../ptb/SlippageCalculator.js';
import type { SpotSwapIntent } from '../../intents/types.js';
import type { BuildContext, BuiltPTB } from '../../ptb/types.js';
import type { ProtocolRegistry } from '../../protocols/ProtocolRegistry.js';

export class SpotSwapStrategy extends BaseStrategy<SpotSwapIntent> {
  readonly name = 'SpotSwapStrategy' as const;
  readonly intentType = 'SPOT_SWAP' as const;

  build(intent: SpotSwapIntent, ctx: BuildContext, registry: ProtocolRegistry): BuiltPTB {
    const builder = new PTBBuilder();
    const tx = builder.getTransaction();
    const coinManager = new CoinManager();

    const protocolName = (!intent.protocol || intent.protocol === 'auto') ? 'cetus' : intent.protocol;
    const adapter = registry.get(protocolName);

    if (!adapter.swap) {
      throw new Error(`Protocol '${protocolName}' does not support swap`);
    }

    const fromCoin = coinManager.splitCoin(tx, intent.fromCoin, intent.amountIn.raw);
    const minOut = SlippageCalculator.applySlippage(intent.amountIn.raw, intent.slippage.bps);

    adapter.swap(tx, ctx, { fromCoin, toCoinType: intent.toCoin, minOut });

    builder.addProtocol(protocolName);
    builder.addSummary(
      `Swap ${intent.amountIn.raw} ${intent.fromCoin} → ${intent.toCoin} via ${protocolName}`,
    );

    return builder.build();
  }
}
