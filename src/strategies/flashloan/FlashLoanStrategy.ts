import { BaseStrategy } from '../BaseStrategy.js';
import { PTBBuilder } from '../../ptb/PTBBuilder.js';
import type { FlashLoanIntent } from '../../intents/types.js';
import type { BuildContext, BuiltPTB } from '../../ptb/types.js';
import type { ProtocolRegistry } from '../../protocols/ProtocolRegistry.js';

export class FlashLoanStrategy extends BaseStrategy<FlashLoanIntent> {
  readonly name = 'FlashLoanStrategy' as const;
  readonly intentType = 'FLASH_LOAN' as const;

  build(intent: FlashLoanIntent, ctx: BuildContext, registry: ProtocolRegistry): BuiltPTB {
    const builder = new PTBBuilder();
    const tx = builder.getTransaction();

    const adapter = registry.get(intent.protocol);

    if (!adapter.flashLoan) {
      throw new Error(`Protocol '${intent.protocol}' does not support flashLoan`);
    }
    if (!adapter.flashRepay) {
      throw new Error(`Protocol '${intent.protocol}' does not support flashRepay`);
    }

    // 1. Initiate flash loan
    const { coin, receipt } = adapter.flashLoan(tx, ctx, {
      coinType: intent.borrowCoin,
      amount: intent.borrowAmount.raw,
    });

    // 2. Process inner intents (placeholder — inner intents are opaque at this level)
    builder.addSummary(
      `Flash loan ${intent.borrowAmount.raw} ${intent.borrowCoin} from ${intent.protocol} with ${intent.innerIntents.length} inner intent(s)`,
    );

    // 3. Repay flash loan
    adapter.flashRepay(tx, ctx, { coin, receipt });

    builder.addProtocol(intent.protocol);

    return builder.build();
  }
}
