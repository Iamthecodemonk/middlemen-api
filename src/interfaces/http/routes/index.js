const { PropertyController } = require("../controllers/PropertyController");
const { ClaimController } = require("../controllers/ClaimController");
const { NegotiationController } = require("../controllers/NegotiationController");
const { DashboardController } = require("../controllers/DashboardController");
const { UserController } = require("../controllers/UserController");
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
  imageUploadQueuedResponseSchema,
  imageUploadStatusResponseSchema,
  negotiationBodySchema,
  negotiationResponseSchema,
  propertyBodySchema,
  propertyListResponseSchema,
  propertySchema,
  updateAvatarBodySchema,
  userSchema
} = require("../../docs/openApiSchemas");
const { updateAvatarSchema } = require("../../../application/dto/auth/authSchemas");
const { UploadController } = require("../controllers/UploadController");

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
        authorizeRoles("property_owner", "agent", "owner", "admin"),
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
        authorizeRoles("user", "tenant", "admin"),
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

  app.put(
    "/api/users/avatar",
    {
      preHandler: [authenticate, validate(updateAvatarSchema)],
      schema: {
        tags: ["Users"],
        summary: "Update authenticated user's avatar URL",
        security: [{ bearerAuth: [] }],
        body: updateAvatarBodySchema,
        response: {
          200: userSchema,
          401: errorResponseSchema,
          422: errorResponseSchema
        }
      }
    },
    UserController.updateAvatar
  );

  app.post(
    "/api/uploads/images",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Uploads"],
        summary: "Upload an image for the authenticated user",
        security: [{ bearerAuth: [] }],
        response: {
          202: imageUploadQueuedResponseSchema,
          401: errorResponseSchema,
          422: errorResponseSchema
        }
      }
    },
    UploadController.enqueueImage
  );

  app.get(
    "/api/uploads/images/:jobId",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Uploads"],
        summary: "Get image upload job status",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: { jobId: { type: "string" } },
          required: ["jobId"]
        },
        response: {
          200: imageUploadStatusResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema
        }
      }
    },
    UploadController.getJobStatus
  );
}

module.exports = { registerRoutes };
