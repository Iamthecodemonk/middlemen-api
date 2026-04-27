const { z } = require("zod");

const recommendNegotiationSchema = z.object({
  state: z.string().min(2),
  city: z.string().min(2),
  propertyType: z.string().min(2),
  bedrooms: z.number().int().min(0).max(20),
  requestedRent: z.number().positive(),
  termMonths: z.number().int().min(1).max(36)
});

module.exports = { recommendNegotiationSchema };
