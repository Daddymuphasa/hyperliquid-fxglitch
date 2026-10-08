import type { config as appConfig } from "../config.js";
import { ConsentService } from "./consent-service.js";
import { HyperliquidClient } from "./hyperliquid-client.js";
import { InMemoryStore } from "./store.js";
import { WhatsAppClient } from "./whatsapp-client.js";

export type AppConfig = typeof appConfig;

export function createServices(config: AppConfig) {
  const store = new InMemoryStore();
  const consent = new ConsentService(store);
  const hyperliquid = new HyperliquidClient(config.HYPERLIQUID_API_URL);
  const whatsapp = new WhatsAppClient(config);

  return {
    config,
    consent,
    hyperliquid,
    store,
    whatsapp
  };
}

export type Services = ReturnType<typeof createServices>;
