import type { TradeRequest } from "../types.js";

export class HyperliquidClient {
  constructor(private readonly apiUrl: string) {}

  async getClearinghouseState(userAddress: string) {
    const response = await fetch(`${this.apiUrl}/info`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "clearinghouseState",
        user: userAddress
      })
    });

    if (!response.ok) {
      throw new Error(`Hyperliquid info request failed with ${response.status}.`);
    }

    return response.json() as Promise<unknown>;
  }

  async submitTrade(_trade: TradeRequest, _agentPrivateKeyCiphertext: string) {
    throw new Error(
      "Trade signing is not wired yet. Implement this with Hyperliquid SDK signing and encrypted API-wallet keys."
    );
  }
}
