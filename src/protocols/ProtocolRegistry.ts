import type { Transaction } from '@mysten/sui/transactions';
import type { BuildContext, CoinRef } from '../ptb/types.js';

export interface ProtocolAdapter {
  readonly name: string;
  swap?(tx: Transaction, ctx: BuildContext, params: { fromCoin: CoinRef; toCoinType: string; minOut: bigint }): CoinRef;
  deposit?(tx: Transaction, ctx: BuildContext, params: { coin: CoinRef; enableCollateral?: boolean }): void;
  borrow?(tx: Transaction, ctx: BuildContext, params: { coinType: string; amount: bigint }): CoinRef;
  repay?(tx: Transaction, ctx: BuildContext, params: { coin: CoinRef }): void;
  flashLoan?(tx: Transaction, ctx: BuildContext, params: { coinType: string; amount: bigint }): { coin: CoinRef; receipt: unknown };
  flashRepay?(tx: Transaction, ctx: BuildContext, params: { coin: CoinRef; receipt: unknown }): void;
  addLiquidity?(tx: Transaction, ctx: BuildContext, params: { poolId: string; coinA: CoinRef; coinB: CoinRef; tickLower: number; tickUpper: number }): void;
  removeLiquidity?(tx: Transaction, ctx: BuildContext, params: { poolId: string; positionId: string; percentage: number }): { coinA: CoinRef; coinB: CoinRef };
}

export class ProtocolRegistry {
  private adapters = new Map<string, ProtocolAdapter>();

  register(adapter: ProtocolAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  get(name: string): ProtocolAdapter {
    const adapter = this.adapters.get(name);
    if (!adapter) throw new Error(`Protocol adapter '${name}' not found`);
    return adapter;
  }

  has(name: string): boolean {
    return this.adapters.has(name);
  }

  list(): string[] {
    return [...this.adapters.keys()];
  }
}
