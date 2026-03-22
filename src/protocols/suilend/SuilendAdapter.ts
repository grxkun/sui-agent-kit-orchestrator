import type { Transaction, TransactionResult } from '@mysten/sui/transactions';
import type { BuildContext, CoinRef } from '../../ptb/types.js';
import type { ProtocolAdapter } from '../ProtocolRegistry.js';
import { SUILEND_MAINNET, SUILEND_TESTNET } from './constants.js';

function getConfig(network: BuildContext['network']) {
  return network === 'mainnet' ? SUILEND_MAINNET : SUILEND_TESTNET;
}

export class SuilendAdapter implements ProtocolAdapter {
  readonly name = 'suilend' as const;

  deposit(
    tx: Transaction,
    ctx: BuildContext,
    params: { coin: CoinRef; enableCollateral?: boolean },
  ): void {
    const cfg = getConfig(ctx.network);
    tx.moveCall({
      target: `${cfg.PACKAGE_ID}::lending::deposit`,
      arguments: [
        tx.object(cfg.LENDING_MARKET),
        tx.object(cfg.ORACLE),
        params.coin.result,
        tx.pure.bool(params.enableCollateral ?? true),
      ],
      typeArguments: [params.coin.coinType],
    });
  }

  borrow(
    tx: Transaction,
    ctx: BuildContext,
    params: { coinType: string; amount: bigint },
  ): CoinRef {
    const cfg = getConfig(ctx.network);
    const result = tx.moveCall({
      target: `${cfg.PACKAGE_ID}::lending::borrow`,
      arguments: [
        tx.object(cfg.LENDING_MARKET),
        tx.object(cfg.ORACLE),
        tx.pure.u64(params.amount),
      ],
      typeArguments: [params.coinType],
    });
    return { result, coinType: params.coinType, amount: params.amount };
  }

  repay(
    tx: Transaction,
    ctx: BuildContext,
    params: { coin: CoinRef },
  ): void {
    const cfg = getConfig(ctx.network);
    tx.moveCall({
      target: `${cfg.PACKAGE_ID}::lending::repay`,
      arguments: [
        tx.object(cfg.LENDING_MARKET),
        tx.object(cfg.ORACLE),
        params.coin.result,
      ],
      typeArguments: [params.coin.coinType],
    });
  }

  flashLoan(
    tx: Transaction,
    ctx: BuildContext,
    params: { coinType: string; amount: bigint },
  ): { coin: CoinRef; receipt: unknown } {
    const cfg = getConfig(ctx.network);
    const result = tx.moveCall({
      target: `${cfg.PACKAGE_ID}::lending::flash_loan`,
      arguments: [
        tx.object(cfg.LENDING_MARKET),
        tx.pure.u64(params.amount),
      ],
      typeArguments: [params.coinType],
    });
    return {
      coin: { result: result[0] as unknown as TransactionResult, coinType: params.coinType, amount: params.amount },
      receipt: result[1],
    };
  }

  flashRepay(
    tx: Transaction,
    ctx: BuildContext,
    params: { coin: CoinRef; receipt: unknown },
  ): void {
    const cfg = getConfig(ctx.network);
    tx.moveCall({
      target: `${cfg.PACKAGE_ID}::lending::flash_repay`,
      arguments: [
        tx.object(cfg.LENDING_MARKET),
        params.coin.result,
        params.receipt as TransactionResult,
      ],
      typeArguments: [params.coin.coinType],
    });
  }
}
