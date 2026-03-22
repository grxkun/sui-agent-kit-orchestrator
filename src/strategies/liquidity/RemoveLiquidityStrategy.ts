import { BaseStrategy } from '../BaseStrategy.js';
import { PTBBuilder } from '../../ptb/PTBBuilder.js';
import type { RemoveLiquidityIntent } from '../../intents/types.js';
import type { BuildContext, BuiltPTB } from '../../ptb/types.js';
import type { ProtocolRegistry } from '../../protocols/ProtocolRegistry.js';

export class RemoveLiquidityStrategy extends BaseStrategy<RemoveLiquidityIntent> {
  readonly name = 'RemoveLiquidityStrategy' as const;
  readonly intentType = 'REMOVE_LIQUIDITY' as const;

  build(intent: RemoveLiquidityIntent, ctx: BuildContext, registry: ProtocolRegistry): BuiltPTB {
    const builder = new PTBBuilder();
    const tx = builder.getTransaction();

    // Use cetus as the default liquidity protocol
    const adapter = registry.get('cetus');

    if (!adapter.removeLiquidity) {
      throw new Error("Protocol 'cetus' does not support removeLiquidity");
    }

    adapter.removeLiquidity(tx, ctx, {
      poolId: intent.poolId,
      positionId: intent.positionId,
      percentage: intent.percentage,
    });

    builder.addProtocol(adapter.name);
    builder.addSummary(
      `Remove ${intent.percentage}% liquidity from pool ${intent.poolId} (position ${intent.positionId})`,
    );

    return builder.build();
  }
}
