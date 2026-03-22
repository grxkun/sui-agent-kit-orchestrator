import type { Transaction } from '@mysten/sui/transactions';
import type { BuildContext, CoinRef } from '../../ptb/types.js';
import type { ProtocolAdapter } from '../ProtocolRegistry.js';
import { DEEPBOOK_MAINNET, DEEPBOOK_TESTNET } from './constants.js';

function getConfig(network: BuildContext['network']) {
  return network === 'mainnet' ? DEEPBOOK_MAINNET : DEEPBOOK_TESTNET;
}

export class DeepBookAdapter implements ProtocolAdapter {
  readonly name = 'deepbook' as const;

  swap(
    tx: Transaction,
    ctx: BuildContext,
    params: { fromCoin: CoinRef; toCoinType: string; minOut: bigint },
  ): CoinRef {
    const cfg = getConfig(ctx.network);
    const result = tx.moveCall({
      target: `${cfg.PACKAGE_ID}::clob::swap`,
      arguments: [
        tx.object(cfg.REGISTRY),
        params.fromCoin.result,
        tx.pure.u64(params.minOut),
      ],
      typeArguments: [params.fromCoin.coinType, params.toCoinType],
    });
    // Amount is the minimum expected; actual on-chain output may be higher
    return { result, coinType: params.toCoinType, amount: params.minOut };
  }
}
