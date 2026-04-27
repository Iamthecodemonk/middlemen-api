const { PropertyController } = require("../controllers/PropertyController");
const { ClaimController } = require("../controllers/ClaimController");
const { NegotiationController } = require("../controllers/NegotiationController");
const { DashboardController } = require("../controllers/DashboardController");
const { validate } = require("../middleware/validate");
const { authenticate } = require("../middleware/auth/authenticate");
const { authorizeRoles } = require("../middleware/auth/authorizeRoles");
const { buildAuthRouter } = require("./auth");
const { createPropertySchema } = require("../../../application/dto/propertySchemas");
const { claimPropertySchema } = require("../../../application/dto/claimSchemas");
const {
  recommendNegotiationSchema
} = require("../../../application/dto/negotiationSchemas");
const {
  claimBodySchema,
  claimResponseSchema,
  dashboardParamsSchema,
  dashboardResponseSchema,
  errorResponseSchema,
  negotiationBodySchema,
  negotiationResponseSchema,
  propertyBodySchema,
  propertyListResponseSchema,
  propertySchema
} = require("../../docs/openApiSchemas");

function registerRoutes(app) {
  app.get(
    "/health",
    {
      schema: {
        tags: ["System"],
        summary: "Health check",
        response: {
          200: {
            type: "object",
            additionalProperties: false,
            required: ["status"],
            properties: {
              status: { type: "string", enum: ["ok"] }
            }
          }
        }
      }
    },
    async () => ({ status: "ok" })
  );

  app.register(buildAuthRouter, { prefix: "/api/auth" });

  app.post(
    "/api/properties",
    {
      preHandler: [
        authenticate,
        authorizeRoles("owner", "admin"),
        validate(createPropertySchema)
      ],
      schema: {
        tags: ["Properties"],
        summary: "Create a property listing",
        security: [{ bearerAuth: [] }],
        body: propertyBodySchema,
        response: {
          201: propertySchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          422: errorResponseSchema
        }
      }
    },
    PropertyController.create
  );

  app.get(
    "/api/properties",
    {
      schema: {
        tags: ["Properties"],
        summary: "List properties",
        response: {
          200: propertyListResponseSchema
        }
      }
    },
    PropertyController.list
  );

  app.post(
    "/api/claims",
    {
      preHandler: [
        authenticate,
        authorizeRoles("tenant", "admin"),
        validate(claimPropertySchema)
      ],
      schema: {
        tags: ["Claims"],
        summary: "Create a property claim",
        security: [{ bearerAuth: [] }],
        body: claimBodySchema,
        response: {
          201: claimResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema
        }
      }
    },
    ClaimController.create
  );

  app.post(
    "/api/negotiations/recommend",
    {
      preHandler: validate(recommendNegotiationSchema),
      schema: {
        tags: ["Negotiations"],
        summary: "Get an AI-assisted negotiation recommendation",
        body: negotiationBodySchema,
        response: {
          200: negotiationResponseSchema,
          422: errorResponseSchema
        }
      }
    },
    NegotiationController.recommend
  );

  app.get(
    "/api/dashboard/:actorType/:actorId",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Dashboard"],
        summary: "Get dashboard summary",
        security: [{ bearerAuth: [] }],
        params: dashboardParamsSchema,
        response: {
          200: dashboardResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema
        }
      }
    },
    DashboardController.summary
  );
}

module.exports = { registerRoutes };
