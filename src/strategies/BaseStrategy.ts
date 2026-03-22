import type { Intent } from '../intents/types.js';
import type { BuildContext, BuiltPTB } from '../ptb/types.js';
import type { ProtocolRegistry } from '../protocols/ProtocolRegistry.js';

export abstract class BaseStrategy<T extends Intent = Intent> {
  abstract readonly name: string;
  abstract readonly intentType: T['type'];

  abstract build(intent: T, ctx: BuildContext, registry: ProtocolRegistry): BuiltPTB;
}
