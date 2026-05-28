const { createApp } = require("./app");
const { env } = require("./infrastructure/config/env");
const { startImageUploadWorker } = require("./infrastructure/queue/imageUploadWorker");

async function bootstrap() {
  const app = await createApp();
  // start background worker for image uploads
  startImageUploadWorker();
  await app.listen({
    port: env.port,
    host: "0.0.0.0"
  });
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap application", error);
  process.exit(1);
});
