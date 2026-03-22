import { BaseStrategy } from '../BaseStrategy.js';
import { PTBBuilder } from '../../ptb/PTBBuilder.js';
import { CoinManager } from '../../ptb/CoinManager.js';
import { SlippageCalculator } from '../../ptb/SlippageCalculator.js';
import type { LeverageShortIntent } from '../../intents/types.js';
import type { BuildContext, BuiltPTB } from '../../ptb/types.js';
import type { ProtocolRegistry } from '../../protocols/ProtocolRegistry.js';

export class LeverageShortStrategy extends BaseStrategy<LeverageShortIntent> {
  readonly name = 'LeverageShortStrategy' as const;
  readonly intentType = 'LEVERAGE_SHORT' as const;

  build(intent: LeverageShortIntent, ctx: BuildContext, registry: ProtocolRegistry): BuiltPTB {
    const builder = new PTBBuilder();
    const tx = builder.getTransaction();
    const coinManager = new CoinManager();

    const swapProtocol = (!intent.swapProtocol || intent.swapProtocol === 'auto') ? 'cetus' : intent.swapProtocol;
    const lendingAdapter = registry.get(intent.lendingProtocol);
    const swapAdapter = registry.get(swapProtocol);

    if (!lendingAdapter.flashLoan) throw new Error(`Protocol '${intent.lendingProtocol}' does not support flashLoan`);
    if (!lendingAdapter.flashRepay) throw new Error(`Protocol '${intent.lendingProtocol}' does not support flashRepay`);
    if (!lendingAdapter.deposit) throw new Error(`Protocol '${intent.lendingProtocol}' does not support deposit`);
    if (!lendingAdapter.borrow) throw new Error(`Protocol '${intent.lendingProtocol}' does not support borrow`);
    if (!swapAdapter.swap) throw new Error(`Protocol '${swapProtocol}' does not support swap`);

    // Calculate the flash loan amount: (leverageFactor - 1) × collateral
    const flashLoanAmount = intent.collateralAmount.raw * BigInt(Math.floor((intent.leverageFactor - 1) * 1000)) / 1000n;

    // 1. Flash loan stable coin
    const { coin: flashCoin, receipt } = lendingAdapter.flashLoan(tx, ctx, {
      coinType: intent.stableCoin,
      amount: flashLoanAmount,
    });

    // 2. Deposit user stable + flash loaned stables as collateral
    const userStable = coinManager.splitCoin(tx, intent.stableCoin, intent.collateralAmount.raw);
    const totalStable = coinManager.mergeCoinRefs(tx, userStable, flashCoin);
    lendingAdapter.deposit(tx, ctx, { coin: totalStable, enableCollateral: true });

    // 3. Borrow asset
    const borrowedAsset = lendingAdapter.borrow(tx, ctx, {
      coinType: intent.asset,
      amount: flashLoanAmount,
    });

    // 4. Swap asset to stable
    const minStableOut = SlippageCalculator.applySlippage(borrowedAsset.amount, intent.slippage.bps);
    const stableCoin = swapAdapter.swap(tx, ctx, {
      fromCoin: borrowedAsset,
      toCoinType: intent.stableCoin,
      minOut: minStableOut,
    });

    // 5. Repay flash loan
    lendingAdapter.flashRepay(tx, ctx, { coin: stableCoin, receipt });

    builder.addProtocol(intent.lendingProtocol);
    builder.addProtocol(swapProtocol);
    builder.addSummary(
      `Leverage short ${intent.asset} at ${intent.leverageFactor}x: flash loan → deposit → borrow → swap → repay`,
    );

    return builder.build();
  }
}
