import type { Transaction, TransactionResult } from '@mysten/sui/transactions';
import type { BuildContext, CoinRef } from '../../ptb/types.js';
import type { ProtocolAdapter } from '../ProtocolRegistry.js';
import { CETUS_MAINNET, CETUS_TESTNET } from './constants.js';

function getConfig(network: BuildContext['network']) {
  return network === 'mainnet' ? CETUS_MAINNET : CETUS_TESTNET;
}

export class CetusAdapter implements ProtocolAdapter {
  readonly name = 'cetus' as const;

  swap(
    tx: Transaction,
    ctx: BuildContext,
    params: { fromCoin: CoinRef; toCoinType: string; minOut: bigint },
  ): CoinRef {
    const cfg = getConfig(ctx.network);
    const result = tx.moveCall({
      target: `${cfg.PACKAGE_ID}::pool::swap`,
      arguments: [
        tx.object(cfg.GLOBAL_CONFIG),
        params.fromCoin.result,
        tx.pure.u64(params.minOut),
      ],
      typeArguments: [params.fromCoin.coinType, params.toCoinType],
    });
    // Amount is the minimum expected; actual on-chain output may be higher
    return { result, coinType: params.toCoinType, amount: params.minOut };
  }

  addLiquidity(
    tx: Transaction,
    ctx: BuildContext,
    params: { poolId: string; coinA: CoinRef; coinB: CoinRef; tickLower: number; tickUpper: number },
  ): void {
    const cfg = getConfig(ctx.network);
    tx.moveCall({
      target: `${cfg.PACKAGE_ID}::pool::add_liquidity`,
      arguments: [
        tx.object(cfg.GLOBAL_CONFIG),
        tx.object(params.poolId),
        params.coinA.result,
        params.coinB.result,
        tx.pure.u32(params.tickLower),
        tx.pure.u32(params.tickUpper),
      ],
      typeArguments: [params.coinA.coinType, params.coinB.coinType],
    });
  }

  removeLiquidity(
    tx: Transaction,
    ctx: BuildContext,
    params: { poolId: string; positionId: string; percentage: number },
  ): { coinA: CoinRef; coinB: CoinRef } {
    const cfg = getConfig(ctx.network);
    const result = tx.moveCall({
      target: `${cfg.PACKAGE_ID}::pool::remove_liquidity`,
      arguments: [
        tx.object(cfg.GLOBAL_CONFIG),
        tx.object(params.poolId),
        tx.object(params.positionId),
        tx.pure.u64(params.percentage),
      ],
    });
    // Coin types and amounts are unknown at build time; resolved on-chain
    return {
      coinA: { result: result[0] as unknown as TransactionResult, coinType: '', amount: 0n },
      coinB: { result: result[1] as unknown as TransactionResult, coinType: '', amount: 0n },
    };
  }
}
