import type { BaseStrategy } from './BaseStrategy.js';
import type { IntentType } from '../intents/types.js';

export class StrategyRegistry {
  private strategies = new Map<string, BaseStrategy>();

  register(strategy: BaseStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  getByName(name: string): BaseStrategy {
    const s = this.strategies.get(name);
    if (!s) throw new Error(`Strategy '${name}' not found`);
    return s;
  }

  getByIntentType(intentType: IntentType): BaseStrategy | undefined {
    for (const s of this.strategies.values()) {
      if (s.intentType === intentType) return s;
    }
    return undefined;
  }

  list(): string[] {
    return [...this.strategies.keys()];
  }
}
