import type { AppConfig } from "./index.js";

export class WhatsAppClient {
  constructor(private readonly config: AppConfig) {}

  async sendText(to: string, body: string) {
    if (this.config.NODE_ENV === "development") {
      return { dryRun: true, to, body };
    }

    const url = `https://graph.facebook.com/v20.0/${this.config.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.config.WHATSAPP_ACCESS_TOKEN}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body }
      })
    });

    if (!response.ok) {
      throw new Error(`WhatsApp message failed with ${response.status}.`);
    }

    return response.json() as Promise<unknown>;
  }
}
