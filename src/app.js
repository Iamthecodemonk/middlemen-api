const Fastify = require("fastify");
const { createContainer } = require("./infrastructure/config/container");
const { registerRoutes } = require("./interfaces/http/routes");
const { errorHandler } = require("./interfaces/http/middleware/errorHandler");
const { setupSwagger } = require("./interfaces/docs/swagger");

async function createApp() {
  const app = Fastify({
    logger: true
  });
  const container = await createContainer();

  app.decorate("container", container);
  app.decorateRequest("auth", null);

  await setupSwagger(app);
  await registerRoutes(app);
  app.setErrorHandler(errorHandler);

  return app;
}

module.exports = { createApp };
