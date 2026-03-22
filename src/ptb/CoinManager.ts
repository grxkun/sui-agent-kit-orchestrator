import type { Transaction } from '@mysten/sui/transactions';
import type { CoinRef } from './types.js';

export class CoinManager {
  private coins: CoinRef[] = [];

  splitCoin(tx: Transaction, coinType: string, amount: bigint): CoinRef {
    const result = tx.splitCoins(tx.gas, [amount]);
    const ref: CoinRef = { result, coinType, amount };
    this.coins.push(ref);
    return ref;
  }

  mergeCoinRefs(tx: Transaction, primary: CoinRef, ...others: CoinRef[]): CoinRef {
    if (others.length > 0) {
      tx.mergeCoins(primary.result, others.map(c => c.result));
    }
    return {
      result: primary.result,
      coinType: primary.coinType,
      amount: primary.amount + others.reduce((sum, c) => sum + c.amount, 0n),
    };
  }

  getAll(): CoinRef[] {
    return [...this.coins];
  }
}
