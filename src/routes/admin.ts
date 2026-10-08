import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Services } from "../services/index.js";

const tradeSchema = z.object({
  userId: z.string().min(1),
  asset: z.number().int().nonnegative(),
  isBuy: z.boolean(),
  size: z.number().positive(),
  limitPrice: z.number().positive(),
  reduceOnly: z.boolean().default(false),
  clientOrderId: z.string().min(1).optional()
});

export function registerAdminRoutes(app: FastifyInstance, services: Services) {
  app.addHook("preHandler", async (request, reply) => {
    if (!request.url.startsWith("/admin")) {
      return;
    }

    if (request.headers.authorization !== `Bearer ${services.config.ADMIN_API_KEY}`) {
      return reply.code(401).send({ error: "Unauthorized." });
    }
  });

  app.post("/admin/trades", async (request, reply) => {
    const trade = tradeSchema.parse(request.body);
    const user = services.store.getUser(trade.userId);

    if (!user?.agentPrivateKeyCiphertext) {
      return reply.code(409).send({ error: "User does not have an approved API wallet credential." });
    }

    services.consent.assertCanTradeForUser(user.id, trade);
    const result = await services.hyperliquid.submitTrade(trade, user.agentPrivateKeyCiphertext);

    return reply.send({ ok: true, result });
  });

  app.get("/admin/users/:userId/account-state", async (request, reply) => {
    const params = z.object({ userId: z.string().min(1) }).parse(request.params);
    const user = services.store.getUser(params.userId);

    if (!user) {
      return reply.code(404).send({ error: "User not found." });
    }

    const state = await services.hyperliquid.getClearinghouseState(user.hyperliquidAccountAddress);
    return reply.send({ ok: true, state });
  });
}
