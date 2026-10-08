import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { Services } from "../services/index.js";

const webhookQuerySchema = z.object({
  "hub.mode": z.string().optional(),
  "hub.verify_token": z.string().optional(),
  "hub.challenge": z.string().optional()
});

const incomingMessageSchema = z.object({
  entry: z
    .array(
      z.object({
        changes: z.array(z.unknown()).optional()
      })
    )
    .optional()
});

export function registerWhatsAppRoutes(app: FastifyInstance, services: Services) {
  app.get("/webhooks/whatsapp", async (request, reply) => {
    const query = webhookQuerySchema.parse(request.query);

    if (query["hub.mode"] === "subscribe" && query["hub.verify_token"] === services.config.WHATSAPP_VERIFY_TOKEN) {
      return reply.code(200).send(query["hub.challenge"] ?? "");
    }

    return reply.code(403).send({ error: "Invalid verification token." });
  });

  app.post("/webhooks/whatsapp", async (request, reply) => {
    incomingMessageSchema.parse(request.body);

    const whatsAppId = extractSenderId(request.body) ?? "dev-user";
    const session = services.store.saveSession({
      id: nanoid(24),
      whatsAppId,
      status: "created",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });

    const link = `${services.config.PUBLIC_APP_URL}/connect/${session.id}`;
    await services.whatsapp.sendText(
      whatsAppId,
      `Open this secure link to connect your wallet and approve trading access: ${link}`
    );

    return reply.code(200).send({ ok: true });
  });
}

function extractSenderId(body: unknown) {
  const value = body as {
    entry?: Array<{ changes?: Array<{ value?: { messages?: Array<{ from?: string }> } }> }>;
  };

  return value.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
}
