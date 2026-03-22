import { BaseStrategy } from '../BaseStrategy.js';
import { PTBBuilder } from '../../ptb/PTBBuilder.js';
import type { BorrowIntent } from '../../intents/types.js';
import type { BuildContext, BuiltPTB } from '../../ptb/types.js';
import type { ProtocolRegistry } from '../../protocols/ProtocolRegistry.js';

export class BorrowStrategy extends BaseStrategy<BorrowIntent> {
  readonly name = 'BorrowStrategy' as const;
  readonly intentType = 'BORROW' as const;

  build(intent: BorrowIntent, ctx: BuildContext, registry: ProtocolRegistry): BuiltPTB {
    const builder = new PTBBuilder();
    const tx = builder.getTransaction();

    const adapter = registry.get(intent.protocol);

    if (!adapter.borrow) {
      throw new Error(`Protocol '${intent.protocol}' does not support borrow`);
    }

    adapter.borrow(tx, ctx, { coinType: intent.coin, amount: intent.amount.raw });

    builder.addProtocol(intent.protocol);
    builder.addSummary(
      `Borrow ${intent.amount.raw} ${intent.coin} from ${intent.protocol}`,
    );

    return builder.build();
  }
}
