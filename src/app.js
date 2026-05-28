const Fastify = require("fastify");
const { env } = require("./infrastructure/config/env");
const { createContainer } = require("./infrastructure/config/container");
const { LoggerService } = require("./infrastructure/services/LoggerService");
const { registerRoutes } = require("./interfaces/http/routes");
const { errorHandler } = require("./interfaces/http/middleware/errorHandler");
const { setupSwagger } = require("./interfaces/docs/swagger");
const fastifyMultipart = require("@fastify/multipart");

async function createApp() {
  const app = Fastify({
    logger: LoggerService.createFastifyLoggerConfig(env)
  });
  const container = await createContainer();

  app.decorate("container", container);
  app.decorateRequest("auth", null);
  // register multipart plugin for file uploads
  await app.register(fastifyMultipart, { limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

  await setupSwagger(app);
  await registerRoutes(app);
  app.setErrorHandler(errorHandler);

  return app;
}

module.exports = { createApp };
