import { BaseStrategy } from '../BaseStrategy.js';
import { PTBBuilder } from '../../ptb/PTBBuilder.js';
import { CoinManager } from '../../ptb/CoinManager.js';
import type { DepositIntent } from '../../intents/types.js';
import type { BuildContext, BuiltPTB } from '../../ptb/types.js';
import type { ProtocolRegistry } from '../../protocols/ProtocolRegistry.js';

export class DepositStrategy extends BaseStrategy<DepositIntent> {
  readonly name = 'DepositStrategy' as const;
  readonly intentType = 'DEPOSIT' as const;

  build(intent: DepositIntent, ctx: BuildContext, registry: ProtocolRegistry): BuiltPTB {
    const builder = new PTBBuilder();
    const tx = builder.getTransaction();
    const coinManager = new CoinManager();

    const adapter = registry.get(intent.protocol);

    if (!adapter.deposit) {
      throw new Error(`Protocol '${intent.protocol}' does not support deposit`);
    }

    const coin = coinManager.splitCoin(tx, intent.coin, intent.amount.raw);

    adapter.deposit(tx, ctx, { coin, enableCollateral: intent.enableCollateral });

    builder.addProtocol(intent.protocol);
    builder.addSummary(
      `Deposit ${intent.amount.raw} ${intent.coin} into ${intent.protocol}`,
    );

    return builder.build();
  }
}
