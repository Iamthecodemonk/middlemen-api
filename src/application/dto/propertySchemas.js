const { z } = require("zod");

const createPropertySchema = z.object({
  ownerId: z.string().uuid().optional(),
  title: z.string().min(5),
  description: z.string().optional().default(""),
  propertyType: z.enum(["rent", "sale", "fractional"]).default("rent"),
  state: z.string().min(2),
  city: z.string().min(2),
  address: z.string().min(5),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  bedrooms: z.number().int().min(0).max(50).default(1),
  bathrooms: z.number().min(0).max(50).default(1),
  squareMeters: z.number().int().positive().optional(),
  rentAmount: z.number().positive(),
  securityDeposit: z.number().min(0).default(0),
  paymentMode: z.enum(["upfront", "wallet_installment"]),
  renewalMode: z.enum(["one_off", "auto_renewal"]),
  leaseTermMonths: z.number().int().min(1).max(36)
});

module.exports = { createPropertySchema };
