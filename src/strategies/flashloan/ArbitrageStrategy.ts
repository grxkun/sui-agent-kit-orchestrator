import { BaseStrategy } from '../BaseStrategy.js';
import { PTBBuilder } from '../../ptb/PTBBuilder.js';
import { SlippageCalculator } from '../../ptb/SlippageCalculator.js';
import type { ArbitrageIntent } from '../../intents/types.js';
import type { BuildContext, BuiltPTB } from '../../ptb/types.js';
import type { ProtocolRegistry } from '../../protocols/ProtocolRegistry.js';

export class ArbitrageStrategy extends BaseStrategy<ArbitrageIntent> {
  readonly name = 'ArbitrageStrategy' as const;
  readonly intentType = 'ARBITRAGE' as const;

  build(intent: ArbitrageIntent, ctx: BuildContext, registry: ProtocolRegistry): BuiltPTB {
    const builder = new PTBBuilder();
    const tx = builder.getTransaction();

    const lendingAdapter = registry.get(intent.flashLoanProtocol);

    if (!lendingAdapter.flashLoan) throw new Error(`Protocol '${intent.flashLoanProtocol}' does not support flashLoan`);
    if (!lendingAdapter.flashRepay) throw new Error(`Protocol '${intent.flashLoanProtocol}' does not support flashRepay`);

    const [legA, legB] = intent.route;

    const swapProtocolA = (!legA.protocol || legA.protocol === 'auto') ? 'cetus' : legA.protocol;
    const swapProtocolB = (!legB.protocol || legB.protocol === 'auto') ? 'cetus' : legB.protocol;

    const swapAdapterA = registry.get(swapProtocolA);
    const swapAdapterB = registry.get(swapProtocolB);

    if (!swapAdapterA.swap) throw new Error(`Protocol '${swapProtocolA}' does not support swap`);
    if (!swapAdapterB.swap) throw new Error(`Protocol '${swapProtocolB}' does not support swap`);

    // 1. Flash loan
    const { coin: flashCoin, receipt } = lendingAdapter.flashLoan(tx, ctx, {
      coinType: intent.flashLoanCoin,
      amount: intent.flashLoanAmount.raw,
    });

    // 2. Swap A → B
    const minOutA = SlippageCalculator.applySlippage(flashCoin.amount, legA.slippage.bps);
    const coinB = swapAdapterA.swap(tx, ctx, {
      fromCoin: flashCoin,
      toCoinType: legA.toCoin,
      minOut: minOutA,
    });

    // 3. Swap B → A (back to flash loan coin)
    const minOutB = SlippageCalculator.applySlippage(coinB.amount, legB.slippage.bps);
    const finalCoin = swapAdapterB.swap(tx, ctx, {
      fromCoin: coinB,
      toCoinType: legB.toCoin,
      minOut: minOutB,
    });

    // 4. Repay flash loan
    lendingAdapter.flashRepay(tx, ctx, { coin: finalCoin, receipt });

    const minProfit = intent.minProfitRaw ?? 0n;
    builder.addProtocol(intent.flashLoanProtocol);
    builder.addProtocol(swapProtocolA);
    builder.addProtocol(swapProtocolB);
    builder.addSummary(
      `Arbitrage: flash loan ${intent.flashLoanAmount.raw} ${intent.flashLoanCoin} → swap via ${swapProtocolA} → swap via ${swapProtocolB} → repay (min profit: ${minProfit})`,
    );

    return builder.build();
  }
}
