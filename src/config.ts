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
  TELEGRAM_BOT_TOKEN: z.string().min(1).default("dev-token"),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1).default("dev-secret"),
  TELEGRAM_ALLOWED_CHAT_ID: z.string().min(1).default("dev-chat"),
  TELEGRAM_API_ID: z.string().min(1).default("dev-api-id"),
  TELEGRAM_API_HASH: z.string().min(1).default("dev-api-hash"),
  ENCRYPTION_KEY_BASE64: z
    .string()
    .min(1)
    .default("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
    .refine((value) => Buffer.from(value, "base64").length === 32, {
      message: "ENCRYPTION_KEY_BASE64 must decode to exactly 32 bytes."
    })
});

export const config = configSchema.parse(process.env);
