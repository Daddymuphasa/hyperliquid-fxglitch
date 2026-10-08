import type { TradeRequest } from "../types.js";
import type { InMemoryStore } from "./store.js";

export class ConsentService {
  constructor(private readonly store: InMemoryStore) {}

  assertCanTradeForUser(userId: string, trade: TradeRequest) {
    const consent = this.store.getConsentForUser(userId);

    if (!consent || consent.status !== "active") {
      throw new Error("User has not granted active trading consent.");
    }

    if (consent.expiresAt && consent.expiresAt.getTime() <= Date.now()) {
      throw new Error("User trading consent has expired.");
    }

    if (Math.abs(trade.size) > consent.riskLimits.maxOrderSize) {
      throw new Error("Trade exceeds the user's maximum order size.");
    }

    return consent;
  }
}
