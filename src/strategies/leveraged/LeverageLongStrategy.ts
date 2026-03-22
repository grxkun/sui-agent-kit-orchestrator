import { BaseStrategy } from '../BaseStrategy.js';
import { PTBBuilder } from '../../ptb/PTBBuilder.js';
import { CoinManager } from '../../ptb/CoinManager.js';
import { SlippageCalculator } from '../../ptb/SlippageCalculator.js';
import type { LeverageLongIntent } from '../../intents/types.js';
import type { BuildContext, BuiltPTB } from '../../ptb/types.js';
import type { ProtocolRegistry } from '../../protocols/ProtocolRegistry.js';

export class LeverageLongStrategy extends BaseStrategy<LeverageLongIntent> {
  readonly name = 'LeverageLongStrategy' as const;
  readonly intentType = 'LEVERAGE_LONG' as const;

  build(intent: LeverageLongIntent, ctx: BuildContext, registry: ProtocolRegistry): BuiltPTB {
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

    // 2. Combine user collateral + flash loaned stables, then swap to asset
    const userStable = coinManager.splitCoin(tx, intent.stableCoin, intent.collateralAmount.raw);
    const totalStable = coinManager.mergeCoinRefs(tx, userStable, flashCoin);
    const minAssetOut = SlippageCalculator.applySlippage(totalStable.amount, intent.slippage.bps);
    const assetCoin = swapAdapter.swap(tx, ctx, {
      fromCoin: totalStable,
      toCoinType: intent.asset,
      minOut: minAssetOut,
    });

    // 3. Deposit asset as collateral
    lendingAdapter.deposit(tx, ctx, { coin: assetCoin, enableCollateral: true });

    // 4. Borrow stable to repay flash loan
    const borrowedStable = lendingAdapter.borrow(tx, ctx, {
      coinType: intent.stableCoin,
      amount: flashLoanAmount,
    });

    // 5. Repay flash loan
    lendingAdapter.flashRepay(tx, ctx, { coin: borrowedStable, receipt });

    builder.addProtocol(intent.lendingProtocol);
    builder.addProtocol(swapProtocol);
    builder.addSummary(
      `Leverage long ${intent.asset} at ${intent.leverageFactor}x: flash loan → swap → deposit → borrow → repay`,
    );

    return builder.build();
  }
}
