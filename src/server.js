const { createApp } = require("./app");
const { env } = require("./infrastructure/config/env");

async function bootstrap() {
  const app = await createApp();

  await app.listen({
    port: env.port,
    host: "0.0.0.0"
  });
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap application", error);
  process.exit(1);
});
