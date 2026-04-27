const { z } = require("zod");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one symbol");

const checkAvailabilitySchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(7).optional()
}).refine((value) => value.email || value.phone, {
  message: "Provide email or phone"
});

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(7),
  role: z.enum(["tenant", "owner"]),
  password: passwordSchema,
  mfaChannel: z.enum(["email", "sms"])
}).superRefine((value, ctx) => {
  if (value.mfaChannel === "email" && !value.email) {
    ctx.addIssue({
      code: "custom",
      message: "Email is required when email is the verification channel",
      path: ["email"]
    });
  }
});

const verifyOtpSchema = z.object({
  identifier: z.string().min(3),
  code: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code")
});

const resendOtpSchema = z.object({
  identifier: z.string().min(3)
});

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1)
});

const forgotPasswordSchema = z.object({
  identifier: z.string().min(3)
});

const resetPasswordSchema = z.object({
  token: z.string().uuid(),
  password: passwordSchema
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10)
});

module.exports = {
  checkAvailabilitySchema,
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema
};
