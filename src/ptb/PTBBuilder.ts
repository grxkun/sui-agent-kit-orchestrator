import { Transaction } from '@mysten/sui/transactions';
import type { BuiltPTB } from './types.js';

export class PTBBuilder {
  private tx: Transaction;
  private summary: string[] = [];
  private protocols: Set<string> = new Set();

  constructor() {
    this.tx = new Transaction();
  }

  getTransaction(): Transaction {
    return this.tx;
  }

  addSummary(line: string): void {
    this.summary.push(line);
  }

  addProtocol(name: string): void {
    this.protocols.add(name);
  }

  build(estimatedGasMist?: bigint): BuiltPTB {
    return {
      tx: this.tx,
      summary: [...this.summary],
      estimatedGasMist: estimatedGasMist ?? 10_000_000n,
      protocols: [...this.protocols],
    };
  }
}
