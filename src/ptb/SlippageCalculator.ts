export class SlippageCalculator {
  static applySlippage(amount: bigint, slippageBps: number): bigint {
    return (amount * BigInt(10000 - slippageBps)) / 10000n;
  }

  static addSlippage(amount: bigint, slippageBps: number): bigint {
    return (amount * BigInt(10000 + slippageBps)) / 10000n;
  }
}
