import type { config as appConfig } from "../config.js";
import { ConsentService } from "./consent-service.js";
import { CredentialVault } from "./credential-vault.js";
import { HyperliquidClient } from "./hyperliquid-client.js";
import { SignalParser } from "./signal-parser.js";
import { InMemoryStore } from "./store.js";
import { TelegramUserLoginService } from "./telegram-user-login.js";
import { WhatsAppClient } from "./whatsapp-client.js";

export type AppConfig = typeof appConfig;

export function createServices(config: AppConfig) {
  const store = new InMemoryStore();
  const consent = new ConsentService(store);
  const credentialVault = new CredentialVault(config.ENCRYPTION_KEY_BASE64);
  const hyperliquid = new HyperliquidClient(config.HYPERLIQUID_API_URL);
  const signalParser = new SignalParser();
  const telegramUserLogin = new TelegramUserLoginService();
  const whatsapp = new WhatsAppClient(config);

  return {
    config,
    consent,
    credentialVault,
    hyperliquid,
    signalParser,
    store,
    telegramUserLogin,
    whatsapp
  };
}

export type Services = ReturnType<typeof createServices>;
