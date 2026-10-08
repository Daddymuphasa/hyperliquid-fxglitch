import "dotenv/config";
import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  HYPERLIQUID_API_URL: z.string().url().default("https://api.hyperliquid-testnet.xyz"),
  HYPERLIQUID_CHAIN: z.enum(["Mainnet", "Testnet"]).default("Testnet"),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1).default("dev-token"),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1).default("dev-token"),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).default("dev-phone-id"),
  ADMIN_API_KEY: z.string().min(1).default("dev-admin-key"),
  SESSION_SECRET: z.string().min(16).default("development-session-secret"),
  ENCRYPTION_KEY_BASE64: z.string().min(1).default("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
});

export const config = configSchema.parse(process.env);
