import type { Transaction } from '@mysten/sui/transactions';
import type { Intent } from '../intents/types.js';
import type { BuiltPTB } from '../ptb/types.js';

export interface OrchestratorOptions {
  rpcUrl: string;
  network: 'mainnet' | 'testnet';
  senderAddress: string;
  executor: (ptb: BuiltPTB) => Promise<string>;
  policyMiddleware?: {
    verify: (
      tx: Transaction,
      sender: string,
    ) => Promise<{ status: 'PASS' | 'WARN' | 'BLOCK' }>;
  };
  onBuilt?: (ptb: BuiltPTB, intent: Intent) => void;
  onExecuted?: (txDigest: string, intent: Intent) => void;
}

export interface ExecuteResult {
  txDigest: string;
  intent: Intent;
  ptb: BuiltPTB;
  executedAt: number;
}
