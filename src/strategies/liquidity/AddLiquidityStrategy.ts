import { BaseStrategy } from '../BaseStrategy.js';
import { PTBBuilder } from '../../ptb/PTBBuilder.js';
import { CoinManager } from '../../ptb/CoinManager.js';
import type { AddLiquidityIntent } from '../../intents/types.js';
import type { BuildContext, BuiltPTB } from '../../ptb/types.js';
import type { ProtocolRegistry } from '../../protocols/ProtocolRegistry.js';

export class AddLiquidityStrategy extends BaseStrategy<AddLiquidityIntent> {
  readonly name = 'AddLiquidityStrategy' as const;
  readonly intentType = 'ADD_LIQUIDITY' as const;

  build(intent: AddLiquidityIntent, ctx: BuildContext, registry: ProtocolRegistry): BuiltPTB {
    const builder = new PTBBuilder();
    const tx = builder.getTransaction();
    const coinManager = new CoinManager();

    // Use cetus as the default liquidity protocol
    const adapter = registry.get('cetus');

    if (!adapter.addLiquidity) {
      throw new Error("Protocol 'cetus' does not support addLiquidity");
    }

    const coinA = coinManager.splitCoin(tx, intent.coinA, intent.amountA.raw);
    const coinB = coinManager.splitCoin(tx, intent.coinB, intent.amountB.raw);

    adapter.addLiquidity(tx, ctx, {
      poolId: intent.poolId,
      coinA,
      coinB,
      tickLower: intent.tickLower,
      tickUpper: intent.tickUpper,
    });

    builder.addProtocol(adapter.name);
    builder.addSummary(
      `Add liquidity to pool ${intent.poolId}: ${intent.amountA.raw} ${intent.coinA} + ${intent.amountB.raw} ${intent.coinB}`,
    );

    return builder.build();
  }
}
