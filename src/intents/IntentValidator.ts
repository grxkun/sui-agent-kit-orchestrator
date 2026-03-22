import type { Intent, Amount, Slippage } from './types.js';

export type ValidationResult = { valid: boolean; errors: string[] };

export class IntentValidator {
  static validate(intent: Intent): ValidationResult {
    const errors: string[] = [];

    if ('slippage' in intent) {
      IntentValidator.validateSlippage(intent.slippage, errors);
    }

    switch (intent.type) {
      case 'SPOT_SWAP':
        IntentValidator.validateAmount(intent.amountIn, 'amountIn', errors);
        break;
      case 'MULTI_HOP_SWAP':
        IntentValidator.validateAmount(intent.amountIn, 'amountIn', errors);
        if (intent.route.length < 2) {
          errors.push('Route must have at least 2 entries');
        }
        break;
      case 'DEPOSIT':
        IntentValidator.validateAmount(intent.amount, 'amount', errors);
        break;
      case 'BORROW':
        IntentValidator.validateAmount(intent.amount, 'amount', errors);
        break;
      case 'REPAY':
        if (intent.amount !== 'max') {
          IntentValidator.validateAmount(intent.amount, 'amount', errors);
        }
        break;
      case 'LEVERAGE_LONG':
      case 'LEVERAGE_SHORT':
        IntentValidator.validateAmount(
          intent.collateralAmount,
          'collateralAmount',
          errors,
        );
        if (intent.leverageFactor < 1.1 || intent.leverageFactor > 10) {
          errors.push('Leverage factor must be between 1.1 and 10');
        }
        break;
      case 'ADD_LIQUIDITY':
        IntentValidator.validateAmount(intent.amountA, 'amountA', errors);
        IntentValidator.validateAmount(intent.amountB, 'amountB', errors);
        break;
      case 'REMOVE_LIQUIDITY':
        if (intent.percentage <= 0 || intent.percentage > 100) {
          errors.push('Percentage must be between 0 (exclusive) and 100');
        }
        break;
      case 'FLASH_LOAN':
        IntentValidator.validateAmount(
          intent.borrowAmount,
          'borrowAmount',
          errors,
        );
        break;
      case 'ARBITRAGE':
        IntentValidator.validateAmount(
          intent.flashLoanAmount,
          'flashLoanAmount',
          errors,
        );
        break;
    }

    return { valid: errors.length === 0, errors };
  }

  private static validateSlippage(
    slippage: Slippage,
    errors: string[],
  ): void {
    if (slippage.bps <= 0 || slippage.bps > 5000) {
      errors.push('Slippage must be between 0 (exclusive) and 5000 bps');
    }
  }

  private static validateAmount(
    amount: Amount,
    field: string,
    errors: string[],
  ): void {
    if (amount.raw <= 0n) {
      errors.push(`${field} must be positive`);
    }
  }
}
