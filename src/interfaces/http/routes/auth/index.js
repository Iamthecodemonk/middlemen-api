const { AuthController } = require("../../controllers/auth/AuthController");
const { validate } = require("../../middleware/validate");
const {
  checkAvailabilitySchema,
  googleAuthSchema,
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema
} = require("../../../../application/dto/auth/authSchemas");
const {
  authSessionResponseSchema,
  checkAvailabilityBodySchema,
  checkAvailabilityResponseSchema,
  errorResponseSchema,
  forgotPasswordBodySchema,
  googleAuthBodySchema,
  loginBodySchema,
  messageResponseSchema,
  refreshTokenBodySchema,
  registerBodySchema,
  registerResponseSchema,
  resendOtpBodySchema,
  resetPasswordBodySchema,
  verifyOtpBodySchema
} = require("../../../docs/openApiSchemas");

async function buildAuthRouter(app) {
  app.post(
    "/check-availability",
    {
      preHandler: validate(checkAvailabilitySchema),
      schema: {
        tags: ["Auth"],
        summary: "Check whether email or phone is available",
        body: checkAvailabilityBodySchema,
        response: {
          200: checkAvailabilityResponseSchema,
          422: errorResponseSchema
        }
      }
    },
    AuthController.checkAvailability
  );

  app.post(
    "/register",
    {
      preHandler: validate(registerSchema),
      schema: {
        tags: ["Auth"],
        summary: "Register a user and send OTP by email or SMS",
        description:
          "Creates a password account and sends the signup OTP using body.mfaChannel. Use mfaChannel=email for SMTP email delivery or mfaChannel=sms for Termii SMS OTP delivery.",
        body: registerBodySchema,
        response: {
          201: registerResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema
        }
      }
    },
    AuthController.register
  );

  app.post(
    "/verify-otp",
    {
      preHandler: validate(verifyOtpSchema),
      schema: {
        tags: ["Auth"],
        summary: "Verify email or SMS OTP and issue tokens",
        description:
          "Verifies the OTP for the user identified by email or phone. Email OTP is checked locally; SMS OTP is verified with Termii using the stored provider reference.",
        body: verifyOtpBodySchema,
        response: {
          200: authSessionResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema
        }
      }
    },
    AuthController.verifyOtp
  );

  app.post(
    "/resend-otp",
    {
      preHandler: validate(resendOtpSchema),
      schema: {
        tags: ["Auth"],
        summary: "Resend signup OTP by the user's selected channel",
        description:
          "Resends OTP using the mfaChannel saved on the user account during registration. Email users receive SMTP email OTP; SMS users receive Termii SMS OTP.",
        body: resendOtpBodySchema,
        response: {
          200: messageResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema
        }
      }
    },
    AuthController.resendOtp
  );

  app.post(
    "/login",
    {
      preHandler: validate(loginSchema),
      schema: {
        tags: ["Auth"],
        summary: "Login with email or phone",
        body: loginBodySchema,
        response: {
          200: authSessionResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          422: errorResponseSchema
        }
      }
    },
    AuthController.login
  );

  app.post(
    "/google",
    {
      preHandler: validate(googleAuthSchema),
      schema: {
        tags: ["Auth"],
        summary: "Login or register with Google",
        body: googleAuthBodySchema,
        response: {
          200: authSessionResponseSchema,
          401: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
          503: errorResponseSchema
        }
      }
    },
    AuthController.google
  );

  app.post(
    "/refresh",
    {
      preHandler: validate(refreshTokenSchema),
      schema: {
        tags: ["Auth"],
        summary: "Rotate refresh token and issue a new session",
        body: refreshTokenBodySchema,
        response: {
          200: authSessionResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema
        }
      }
    },
    AuthController.refresh
  );

  app.post(
    "/forgot-password",
    {
      preHandler: validate(forgotPasswordSchema),
      schema: {
        tags: ["Auth"],
        summary: "Request a password reset token",
        body: forgotPasswordBodySchema,
        response: {
          200: messageResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema
        }
      }
    },
    AuthController.forgotPassword
  );

  app.put(
    "/reset-password",
    {
      preHandler: validate(resetPasswordSchema),
      schema: {
        tags: ["Auth"],
        summary: "Reset password and revoke all refresh tokens",
        body: resetPasswordBodySchema,
        response: {
          200: messageResponseSchema,
          400: errorResponseSchema,
          422: errorResponseSchema
        }
      }
    },
    AuthController.resetPassword
  );
}

module.exports = { buildAuthRouter };
