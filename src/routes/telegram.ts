import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Services } from "../services/index.js";

const telegramUpdateSchema = z.object({
  message: z
    .object({
      message_id: z.number(),
      text: z.string().optional(),
      chat: z.object({
        id: z.union([z.string(), z.number()])
      })
    })
    .optional(),
  channel_post: z
    .object({
      message_id: z.number(),
      text: z.string().optional(),
      chat: z.object({
        id: z.union([z.string(), z.number()])
      })
    })
    .optional()
});

export function registerTelegramRoutes(app: FastifyInstance, services: Services) {
  app.get("/telegram/setup", async (_request, reply) => {
    return reply.type("text/html").send(renderTelegramSetupPage(services.config.PUBLIC_APP_URL));
  });

  app.post("/webhooks/telegram", async (request, reply) => {
    if (request.headers["x-telegram-bot-api-secret-token"] !== services.config.TELEGRAM_WEBHOOK_SECRET) {
      return reply.code(401).send({ error: "Unauthorized Telegram webhook." });
    }

    const update = telegramUpdateSchema.parse(request.body);
    const message = update.message ?? update.channel_post;

    if (!message?.text) {
      return reply.send({ ok: true, ignored: "No text signal." });
    }

    const chatId = String(message.chat.id);

    if (services.config.TELEGRAM_ALLOWED_CHAT_ID !== "dev-chat" && chatId !== services.config.TELEGRAM_ALLOWED_CHAT_ID) {
      return reply.code(403).send({ error: "Telegram chat is not allowed." });
    }

    const signal = services.signalParser.parseTelegramSignal({
      chatId,
      messageId: String(message.message_id),
      text: message.text
    });

    services.store.saveTradeSignal(signal);

    return reply.send({
      ok: true,
      signal: {
        id: signal.id,
        symbol: signal.symbol,
        direction: signal.direction,
        status: signal.status,
        confidence: signal.confidence,
        reasons: signal.reasons
      }
    });
  });
}

function renderTelegramSetupPage(publicAppUrl: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Telegram setup</title>
    <style>
      body { font-family: Inter, ui-sans-serif, system-ui, sans-serif; margin: 0; background: #f6f7f8; color: #151719; }
      main { max-width: 760px; margin: 0 auto; padding: 40px 20px; }
      section { background: white; border: 1px solid #dfe3e6; border-radius: 8px; padding: 24px; }
      h1 { margin: 0 0 8px; font-size: 28px; letter-spacing: 0; }
      p, li { color: #4d565f; line-height: 1.55; }
      code { background: #f0f2f4; border-radius: 4px; padding: 2px 5px; overflow-wrap: anywhere; }
      .notice { background: #eef6f0; color: #173d22; padding: 12px; border-radius: 6px; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>Telegram signal setup</h1>
        <p class="notice">Use a Telegram bot for monitoring. This does not require scanning a QR code or logging in with your personal Telegram account.</p>
        <ol>
          <li>Create a bot in Telegram with BotFather and copy the bot token into your local <code>.env</code> as <code>TELEGRAM_BOT_TOKEN</code>.</li>
          <li>Add the bot to the signal group and allow it to read messages.</li>
          <li>Set the webhook URL to <code>${publicAppUrl}/webhooks/telegram</code> with the secret from <code>TELEGRAM_WEBHOOK_SECRET</code>.</li>
          <li>Send one test signal in the group. The backend response will include the group chat ID while <code>TELEGRAM_ALLOWED_CHAT_ID</code> is still in development mode.</li>
          <li>Put that group chat ID in <code>TELEGRAM_ALLOWED_CHAT_ID</code> so messages from other groups are rejected.</li>
        </ol>
      </section>
    </main>
  </body>
</html>`;
}
