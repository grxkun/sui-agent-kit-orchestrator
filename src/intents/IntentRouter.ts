import type { Intent, IntentType } from './types.js';

const STRATEGY_MAP: Record<IntentType, string> = {
  SPOT_SWAP: 'SpotSwapStrategy',
  MULTI_HOP_SWAP: 'MultiHopSwapStrategy',
  DEPOSIT: 'DepositStrategy',
  BORROW: 'BorrowStrategy',
  REPAY: 'RepayStrategy',
  LEVERAGE_LONG: 'LeverageLongStrategy',
  LEVERAGE_SHORT: 'LeverageShortStrategy',
  ADD_LIQUIDITY: 'AddLiquidityStrategy',
  REMOVE_LIQUIDITY: 'RemoveLiquidityStrategy',
  FLASH_LOAN: 'FlashLoanStrategy',
  ARBITRAGE: 'ArbitrageStrategy',
};

export class IntentRouter {
  static route(intent: Intent): string {
    return STRATEGY_MAP[intent.type];
  }
}
