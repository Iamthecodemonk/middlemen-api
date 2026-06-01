const { PropertyController } = require("../controllers/PropertyController");
const { ClaimController } = require("../controllers/ClaimController");
const { NegotiationController } = require("../controllers/NegotiationController");
const { DashboardController } = require("../controllers/DashboardController");
const { UserController } = require("../controllers/UserController");
const { KycController } = require("../controllers/KycController");
const { validate } = require("../middleware/validate");
const { authenticate } = require("../middleware/auth/authenticate");
const { authorizeRoles } = require("../middleware/auth/authorizeRoles");
const { buildAuthRouter } = require("./auth");
const { createPropertySchema } = require("../../../application/dto/propertySchemas");
const { claimPropertySchema } = require("../../../application/dto/claimSchemas");
const {
  recommendNegotiationSchema
} = require("../../../application/dto/negotiationSchemas");
const { verifyLivenessSchema, verifyNinSchema } = require("../../../application/dto/kycSchemas");
const {
  claimBodySchema,
  claimResponseSchema,
  dashboardParamsSchema,
  dashboardResponseSchema,
  errorResponseSchema,
  imageUploadQueuedResponseSchema,
  imageUploadStatusResponseSchema,
  ninVerificationBodySchema,
  kycStatusResponseSchema,
  livenessVerificationBodySchema,
  livenessVerificationResponseSchema,
  ninVerificationResponseSchema,
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
    "/api/kyc/nin",
    {
      preHandler: [
        authenticate,
        authorizeRoles("property_owner", "agent", "owner", "admin"),
        validate(verifyNinSchema)
      ],
      schema: {
        tags: ["KYC"],
        summary: "Verify landlord NIN with Dojah",
        description:
          "Looks up a Nigerian NIN through Dojah/NIMC-backed verification. When valid, the authenticated landlord account is marked identity verified.",
        security: [{ bearerAuth: [] }],
        body: ninVerificationBodySchema,
        response: {
          200: ninVerificationResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          422: errorResponseSchema,
          503: errorResponseSchema
        }
      }
    },
    KycController.verifyNin
  );

  app.post(
    "/api/kyc/liveness",
    {
      preHandler: [
        authenticate,
        authorizeRoles("property_owner", "agent", "owner", "admin"),
        validate(verifyLivenessSchema)
      ],
      schema: {
        tags: ["KYC"],
        summary: "Verify landlord selfie liveness with Dojah",
        description:
          "Submits a base64 live selfie to Dojah liveness verification. The account becomes fully KYC verified only after both NIN and liveness pass.",
        security: [{ bearerAuth: [] }],
        body: livenessVerificationBodySchema,
        response: {
          200: livenessVerificationResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          422: errorResponseSchema,
          429: errorResponseSchema,
          503: errorResponseSchema
        }
      }
    },
    KycController.verifyLiveness
  );

  app.post(
    "/api/kyc/liveness/retry",
    {
      preHandler: [
        authenticate,
        authorizeRoles("property_owner", "agent", "owner", "admin"),
        validate(verifyLivenessSchema)
      ],
      schema: {
        tags: ["KYC"],
        summary: "Retry failed landlord liveness check",
        security: [{ bearerAuth: [] }],
        body: livenessVerificationBodySchema,
        response: {
          200: livenessVerificationResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          422: errorResponseSchema,
          429: errorResponseSchema
        }
      }
    },
    KycController.retryLiveness
  );

  app.get(
    "/api/kyc/status",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["KYC"],
        summary: "Get authenticated user's KYC status",
        security: [{ bearerAuth: [] }],
        response: {
          200: kycStatusResponseSchema,
          401: errorResponseSchema
        }
      }
    },
    KycController.status
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
