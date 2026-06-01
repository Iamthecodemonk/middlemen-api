const { z } = require("zod");

const verifyNinSchema = z.object({
  nin: z.string().regex(/^\d{11}$/, "NIN must be 11 digits")
});

const verifyLivenessSchema = z.object({
  selfieImageBase64: z.string().min(100, "Selfie image must be a base64 string")
});

module.exports = { verifyLivenessSchema, verifyNinSchema };
