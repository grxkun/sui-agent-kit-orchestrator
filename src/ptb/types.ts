import type { Transaction, TransactionResult } from '@mysten/sui/transactions';
import type { SuiClient } from '@mysten/sui/client';

export interface BuildContext {
  client: SuiClient;
  sender: string;
  network: 'mainnet' | 'testnet';
}

export interface BuiltPTB {
  tx: Transaction;
  summary: string[];
  estimatedGasMist: bigint;
  protocols: string[];
}

export interface CoinRef {
  result: TransactionResult;
  coinType: string;
  amount: bigint;
}
