import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import Fastify from "fastify";
import { config } from "./config.js";
import { createServices } from "./services/index.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerOnboardingRoutes } from "./routes/onboarding.js";
import { registerTelegramRoutes } from "./routes/telegram.js";
import { registerWhatsAppRoutes } from "./routes/whatsapp.js";

const app = Fastify({
  logger: {
    level: config.NODE_ENV === "development" ? "info" : "warn"
  }
});

await app.register(helmet);
await app.register(cors, {
  origin: config.NODE_ENV === "production" ? config.PUBLIC_APP_URL : true
});

const services = createServices(config);

registerHealthRoutes(app);
registerWhatsAppRoutes(app, services);
registerTelegramRoutes(app, services);
registerOnboardingRoutes(app, services);
registerAdminRoutes(app, services);

await app.listen({ port: config.PORT, host: "0.0.0.0" });
