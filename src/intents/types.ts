export type Amount = { raw: bigint; label?: string };
export type Slippage = { bps: number };
export type Deadline = { minutes: number };

export type SpotSwapIntent = {
  type: 'SPOT_SWAP';
  fromCoin: string;
  toCoin: string;
  amountIn: Amount;
  slippage: Slippage;
  protocol?: 'cetus' | 'deepbook' | 'auto';
  deadline?: Deadline;
};

export type MultiHopSwapIntent = {
  type: 'MULTI_HOP_SWAP';
  route: string[];
  amountIn: Amount;
  slippage: Slippage;
};

export type DepositIntent = {
  type: 'DEPOSIT';
  coin: string;
  amount: Amount;
  protocol: 'navi' | 'suilend';
  enableCollateral?: boolean;
};

export type BorrowIntent = {
  type: 'BORROW';
  coin: string;
  amount: Amount;
  protocol: 'navi' | 'suilend';
};

export type RepayIntent = {
  type: 'REPAY';
  coin: string;
  amount: Amount | 'max';
  protocol: 'navi' | 'suilend';
  withdrawAfter?: boolean;
};

export type LeverageLongIntent = {
  type: 'LEVERAGE_LONG';
  asset: string;
  stableCoin: string;
  collateralAmount: Amount;
  leverageFactor: number;
  slippage: Slippage;
  lendingProtocol: 'navi' | 'suilend';
  swapProtocol?: 'cetus' | 'deepbook' | 'auto';
};

export type LeverageShortIntent = {
  type: 'LEVERAGE_SHORT';
  asset: string;
  stableCoin: string;
  collateralAmount: Amount;
  leverageFactor: number;
  slippage: Slippage;
  lendingProtocol: 'navi' | 'suilend';
  swapProtocol?: 'cetus' | 'deepbook' | 'auto';
};

export type AddLiquidityIntent = {
  type: 'ADD_LIQUIDITY';
  poolId: string;
  coinA: string;
  coinB: string;
  amountA: Amount;
  amountB: Amount;
  tickLower: number;
  tickUpper: number;
  slippage: Slippage;
};

export type RemoveLiquidityIntent = {
  type: 'REMOVE_LIQUIDITY';
  poolId: string;
  positionId: string;
  percentage: number;
  slippage: Slippage;
};

export type FlashLoanIntent = {
  type: 'FLASH_LOAN';
  borrowCoin: string;
  borrowAmount: Amount;
  protocol: 'navi' | 'suilend';
  innerIntents: unknown[];
};

export type ArbitrageIntent = {
  type: 'ARBITRAGE';
  flashLoanCoin: string;
  flashLoanAmount: Amount;
  flashLoanProtocol: 'navi' | 'suilend';
  route: [SpotSwapIntent, SpotSwapIntent];
  minProfitRaw?: bigint;
};

export type Intent =
  | SpotSwapIntent
  | MultiHopSwapIntent
  | DepositIntent
  | BorrowIntent
  | RepayIntent
  | LeverageLongIntent
  | LeverageShortIntent
  | AddLiquidityIntent
  | RemoveLiquidityIntent
  | FlashLoanIntent
  | ArbitrageIntent;

export type IntentType = Intent['type'];
