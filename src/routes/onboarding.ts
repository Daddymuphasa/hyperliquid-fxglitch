import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { Services } from "../services/index.js";

const connectParamsSchema = z.object({
  sessionId: z.string().min(1)
});

const walletCallbackSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  agentAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional()
});

export function registerOnboardingRoutes(app: FastifyInstance, services: Services) {
  app.get("/connect/:sessionId", async (request, reply) => {
    const params = connectParamsSchema.parse(request.params);
    const session = services.store.getSession(params.sessionId);

    if (!session || session.expiresAt.getTime() <= Date.now()) {
      return reply.code(404).send({ error: "This connect link is invalid or expired." });
    }

    return reply.type("text/html").send(renderConnectPage(params.sessionId));
  });

  app.post("/connect/:sessionId/callback", async (request, reply) => {
    const params = connectParamsSchema.parse(request.params);
    const body = walletCallbackSchema.parse(request.body);
    const session = services.store.getSession(params.sessionId);

    if (!session || session.expiresAt.getTime() <= Date.now()) {
      return reply.code(404).send({ error: "This connect link is invalid or expired." });
    }

    const user = services.store.saveUser({
      id: nanoid(18),
      whatsAppId: session.whatsAppId,
      walletAddress: body.walletAddress,
      hyperliquidAccountAddress: body.walletAddress,
      agentAddress: body.agentAddress,
      createdAt: new Date()
    });

    services.store.saveConsent({
      userId: user.id,
      status: "active",
      scopes: ["read_account", "place_order", "cancel_order"],
      riskLimits: {
        maxOrderSize: 1,
        maxDailyNotional: 1000
      },
      grantedAt: new Date()
    });

    await services.whatsapp.sendText(
      session.whatsAppId,
      "Your wallet is connected. Trading stays limited to the permissions and risk limits you approved."
    );

    return reply.send({ ok: true, userId: user.id });
  });
}

function renderConnectPage(sessionId: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Connect wallet</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 680px; margin: 48px auto; padding: 0 20px; line-height: 1.5; }
      button { padding: 12px 16px; border: 0; border-radius: 6px; background: #111; color: white; cursor: pointer; }
      code { background: #f2f2f2; padding: 2px 5px; border-radius: 4px; }
    </style>
  </head>
  <body>
    <h1>Connect your wallet</h1>
    <p>This page will become the wallet connection and Hyperliquid API-wallet approval flow.</p>
    <p>Session: <code>${sessionId}</code></p>
    <button type="button">Connect wallet</button>
  </body>
</html>`;
}
