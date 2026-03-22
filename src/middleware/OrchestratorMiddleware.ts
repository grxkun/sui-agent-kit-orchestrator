import { SuiClient } from '@mysten/sui/client';
import type { OrchestratorOptions, ExecuteResult } from './types.js';
import type { Intent } from '../intents/types.js';
import { IntentParser } from '../intents/IntentParser.js';
import { IntentValidator } from '../intents/IntentValidator.js';
import { IntentRouter } from '../intents/IntentRouter.js';
import { ProtocolRegistry } from '../protocols/ProtocolRegistry.js';
import { StrategyRegistry } from '../strategies/StrategyRegistry.js';
import type { BuildContext } from '../ptb/types.js';

import { CetusAdapter } from '../protocols/cetus/CetusAdapter.js';
import { NaviAdapter } from '../protocols/navi/NaviAdapter.js';
import { SuilendAdapter } from '../protocols/suilend/SuilendAdapter.js';
import { DeepBookAdapter } from '../protocols/deepbook/DeepBookAdapter.js';

import { SpotSwapStrategy } from '../strategies/swap/SpotSwapStrategy.js';
import { MultiHopSwapStrategy } from '../strategies/swap/MultiHopSwapStrategy.js';
import { DepositStrategy } from '../strategies/lending/DepositStrategy.js';
import { BorrowStrategy } from '../strategies/lending/BorrowStrategy.js';
import { RepayStrategy } from '../strategies/lending/RepayStrategy.js';
import { LeverageLongStrategy } from '../strategies/leveraged/LeverageLongStrategy.js';
import { LeverageShortStrategy } from '../strategies/leveraged/LeverageShortStrategy.js';
import { AddLiquidityStrategy } from '../strategies/liquidity/AddLiquidityStrategy.js';
import { RemoveLiquidityStrategy } from '../strategies/liquidity/RemoveLiquidityStrategy.js';
import { FlashLoanStrategy } from '../strategies/flashloan/FlashLoanStrategy.js';
import { ArbitrageStrategy } from '../strategies/flashloan/ArbitrageStrategy.js';

export class OrchestratorMiddleware {
  private client: SuiClient;
  private options: OrchestratorOptions;
  private protocolRegistry: ProtocolRegistry;
  private strategyRegistry: StrategyRegistry;

  constructor(options: OrchestratorOptions) {
    this.options = options;
    this.client = new SuiClient({ url: options.rpcUrl });
    this.protocolRegistry = new ProtocolRegistry();
    this.strategyRegistry = new StrategyRegistry();
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.protocolRegistry.register(new CetusAdapter());
    this.protocolRegistry.register(new NaviAdapter());
    this.protocolRegistry.register(new SuilendAdapter());
    this.protocolRegistry.register(new DeepBookAdapter());

    [
      new SpotSwapStrategy(), new MultiHopSwapStrategy(),
      new DepositStrategy(), new BorrowStrategy(), new RepayStrategy(),
      new LeverageLongStrategy(), new LeverageShortStrategy(),
      new AddLiquidityStrategy(), new RemoveLiquidityStrategy(),
      new FlashLoanStrategy(), new ArbitrageStrategy(),
    ].forEach(s => this.strategyRegistry.register(s));
  }

  async execute(rawIntent: unknown): Promise<ExecuteResult> {
    const intent = IntentParser.parse(rawIntent);

    const validation = IntentValidator.validate(intent);
    if (!validation.valid) {
      throw new Error(`Intent validation failed: ${validation.errors.join(', ')}`);
    }

    const strategyName = IntentRouter.route(intent);
    const strategy = this.strategyRegistry.getByName(strategyName);

    const ctx: BuildContext = {
      client: this.client,
      sender: this.options.senderAddress,
      network: this.options.network,
    };
    const ptb = strategy.build(intent, ctx, this.protocolRegistry);

    if (this.options.policyMiddleware) {
      const policy = await this.options.policyMiddleware.verify(ptb.tx, this.options.senderAddress);
      if (policy.status === 'BLOCK') {
        throw new Error('Transaction blocked by policy middleware');
      }
    }

    this.options.onBuilt?.(ptb, intent);

    const txDigest = await this.options.executor(ptb);

    this.options.onExecuted?.(txDigest, intent);

    return { txDigest, intent, ptb, executedAt: Date.now() };
  }

  getProtocolRegistry(): ProtocolRegistry { return this.protocolRegistry; }
  getStrategyRegistry(): StrategyRegistry { return this.strategyRegistry; }
}
