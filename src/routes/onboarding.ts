import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { Services } from "../services/index.js";

const connectParamsSchema = z.object({
  sessionId: z.string().min(1)
});

const walletCallbackSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  agentAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  agentName: z.string().min(3).max(32),
  agentPrivateKey: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  riskLimits: z.object({
    maxOrderSize: z.number().positive().max(100),
    maxDailyNotional: z.number().positive().max(1_000_000)
  })
});

export function registerOnboardingRoutes(app: FastifyInstance, services: Services) {
  app.get("/connect/:sessionId", async (request, reply) => {
    const params = connectParamsSchema.parse(request.params);
    const session = services.store.getSession(params.sessionId);

    if (!session || session.expiresAt.getTime() <= Date.now()) {
      return reply.code(404).send({ error: "This connect link is invalid or expired." });
    }

    return reply.type("text/html").send(renderConnectPage(params.sessionId, services.config.HYPERLIQUID_CHAIN));
  });

  app.post("/connect/:sessionId/callback", async (request, reply) => {
    const params = connectParamsSchema.parse(request.params);
    const body = walletCallbackSchema.parse(request.body);
    const session = services.store.getSession(params.sessionId);

    if (!session || session.expiresAt.getTime() <= Date.now()) {
      return reply.code(404).send({ error: "This connect link is invalid or expired." });
    }

    const approvalNonce = Date.now();

    services.store.updateSession(session.id, {
      status: "agent_prepared",
      walletAddress: body.walletAddress,
      agentAddress: body.agentAddress,
      agentName: body.agentName,
      approvalNonce
    });

    const user = services.store.saveUser({
      id: nanoid(18),
      whatsAppId: session.whatsAppId,
      walletAddress: body.walletAddress,
      hyperliquidAccountAddress: body.walletAddress,
      agentAddress: body.agentAddress,
      agentName: body.agentName,
      agentPrivateKeyCiphertext: services.credentialVault.encryptSecret(body.agentPrivateKey),
      approvalStatus: "prepared",
      createdAt: new Date()
    });

    services.store.saveConsent({
      userId: user.id,
      status: "active",
      scopes: ["read_account", "place_order", "cancel_order"],
      riskLimits: {
        maxOrderSize: body.riskLimits.maxOrderSize,
        maxDailyNotional: body.riskLimits.maxDailyNotional
      },
      grantedAt: new Date()
    });

    await services.whatsapp.sendText(
      session.whatsAppId,
      "Your wallet is connected and your Hyperliquid agent wallet is prepared. Trading stays limited to the permissions and risk limits you approved."
    );

    return reply.send({
      ok: true,
      userId: user.id,
      approval: {
        type: "approveAgent",
        hyperliquidChain: services.config.HYPERLIQUID_CHAIN,
        agentAddress: body.agentAddress,
        agentName: body.agentName,
        nonce: approvalNonce
      }
    });
  });
}

function renderConnectPage(sessionId: string, hyperliquidChain: "Mainnet" | "Testnet") {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Connect wallet</title>
    <script src="https://cdn.jsdelivr.net/npm/ethers@6.13.2/dist/ethers.umd.min.js"></script>
    <style>
      :root { color-scheme: light dark; }
      body { font-family: Inter, ui-sans-serif, system-ui, sans-serif; margin: 0; background: #f6f7f8; color: #151719; }
      main { max-width: 760px; margin: 0 auto; padding: 40px 20px; }
      section { background: white; border: 1px solid #dfe3e6; border-radius: 8px; padding: 24px; }
      h1 { margin: 0 0 8px; font-size: 28px; letter-spacing: 0; }
      p { color: #4d565f; line-height: 1.55; }
      label { display: block; margin: 18px 0 6px; font-weight: 650; }
      input { width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #c8d0d6; border-radius: 6px; font: inherit; }
      button { width: 100%; margin-top: 20px; padding: 13px 16px; border: 0; border-radius: 6px; background: #111; color: white; cursor: pointer; font-weight: 700; }
      button:disabled { cursor: not-allowed; opacity: .5; }
      code, output { overflow-wrap: anywhere; }
      .status { margin-top: 18px; padding: 12px; border-radius: 6px; background: #eef6f0; color: #173d22; }
      .warning { background: #fff7e0; color: #5c4300; padding: 12px; border-radius: 6px; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>Connect wallet</h1>
        <p>Connect your wallet, create a dedicated Hyperliquid agent wallet, and approve limited trading access for this WhatsApp account.</p>
        <p class="warning">Never share your main wallet private key or seed phrase. This flow creates a separate agent wallet for delegated trading.</p>

        <label for="agentName">Agent wallet name</label>
        <input id="agentName" value="whatsapp-agent" maxlength="32" />

        <label for="maxOrderSize">Max order size</label>
        <input id="maxOrderSize" type="number" min="0.0001" step="0.0001" value="1" />

        <label for="maxDailyNotional">Max daily notional</label>
        <input id="maxDailyNotional" type="number" min="1" step="1" value="1000" />

        <button id="connectButton" type="button">Connect and prepare agent</button>
        <div id="status" class="status" hidden></div>
      </section>
    </main>
    <script>
      const statusBox = document.querySelector("#status");
      const button = document.querySelector("#connectButton");

      function setStatus(message) {
        statusBox.hidden = false;
        statusBox.textContent = message;
      }

      button.addEventListener("click", async () => {
        try {
          button.disabled = true;
          setStatus("Connecting wallet...");

          if (!window.ethereum) {
            throw new Error("No browser wallet found. Open this link in a wallet browser or install an EVM wallet.");
          }

          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const walletAddress = await signer.getAddress();
          const agentWallet = ethers.Wallet.createRandom();

          const consentMessage = [
            "Approve delegated Hyperliquid trading access.",
            "Chain: ${hyperliquidChain}",
            "Session: ${sessionId}",
            "Wallet: " + walletAddress,
            "Agent: " + agentWallet.address,
            "Agent name: " + document.querySelector("#agentName").value,
            "Max order size: " + document.querySelector("#maxOrderSize").value,
            "Max daily notional: " + document.querySelector("#maxDailyNotional").value
          ].join("\\n");

          setStatus("Requesting consent signature...");
          await signer.signMessage(consentMessage);

          setStatus("Saving approved agent metadata...");
          const response = await fetch("/connect/${sessionId}/callback", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              walletAddress,
              agentAddress: agentWallet.address,
              agentName: document.querySelector("#agentName").value,
              agentPrivateKey: agentWallet.privateKey,
              riskLimits: {
                maxOrderSize: Number(document.querySelector("#maxOrderSize").value),
                maxDailyNotional: Number(document.querySelector("#maxDailyNotional").value)
              }
            })
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || "Connection failed.");
          }

          setStatus("Agent prepared. Next step: submit the Hyperliquid approveAgent action for " + result.approval.agentAddress + ".");
        } catch (error) {
          setStatus(error instanceof Error ? error.message : "Something went wrong.");
        } finally {
          button.disabled = false;
        }
      });
    </script>
  </body>
</html>`;
}
