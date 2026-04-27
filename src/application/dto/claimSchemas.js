const { z } = require("zod");

const claimPropertySchema = z.object({
  propertyId: z.string().uuid(),
  tenantId: z.string().uuid().optional()
});

module.exports = { claimPropertySchema };
