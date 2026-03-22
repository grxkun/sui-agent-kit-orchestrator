import { BaseStrategy } from '../BaseStrategy.js';
import { PTBBuilder } from '../../ptb/PTBBuilder.js';
import { CoinManager } from '../../ptb/CoinManager.js';
import type { RepayIntent } from '../../intents/types.js';
import type { BuildContext, BuiltPTB } from '../../ptb/types.js';
import type { ProtocolRegistry } from '../../protocols/ProtocolRegistry.js';

export class RepayStrategy extends BaseStrategy<RepayIntent> {
  readonly name = 'RepayStrategy' as const;
  readonly intentType = 'REPAY' as const;

  build(intent: RepayIntent, ctx: BuildContext, registry: ProtocolRegistry): BuiltPTB {
    const builder = new PTBBuilder();
    const tx = builder.getTransaction();
    const coinManager = new CoinManager();

    const adapter = registry.get(intent.protocol);

    if (!adapter.repay) {
      throw new Error(`Protocol '${intent.protocol}' does not support repay`);
    }

    if (intent.amount === 'max') {
      // Sentinel value (u64::MAX) signals full debt repayment; protocol adapters
      // are expected to clamp to the actual outstanding balance.
      const maxCoin = coinManager.splitCoin(tx, intent.coin, BigInt('18446744073709551615'));
      adapter.repay(tx, ctx, { coin: maxCoin });
      builder.addSummary(`Repay max ${intent.coin} to ${intent.protocol}`);
    } else {
      const coin = coinManager.splitCoin(tx, intent.coin, intent.amount.raw);
      adapter.repay(tx, ctx, { coin });
      builder.addSummary(`Repay ${intent.amount.raw} ${intent.coin} to ${intent.protocol}`);
    }

    builder.addProtocol(intent.protocol);

    return builder.build();
  }
}
