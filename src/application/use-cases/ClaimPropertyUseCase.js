const { v4: uuidv4 } = require("uuid");
const { LeaseClaim } = require("../../domain/entities/LeaseClaim");
const { AppError } = require("../../shared/errors/AppError");

class ClaimPropertyUseCase {
  constructor({ propertyRepository, claimRepository }) {
    this.propertyRepository = propertyRepository;
    this.claimRepository = claimRepository;
  }

  async execute(input) {
    const property = await this.propertyRepository.findById(input.propertyId);

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    if (!property.isAvailable) {
      throw new AppError("Property is not available for claim", 409);
    }

    const claim = new LeaseClaim({
      id: uuidv4(),
      propertyId: property.id,
      tenantId: input.tenantId,
      claimAmount: property.totalMoveInCost().amount,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await this.claimRepository.create(claim);
    await this.propertyRepository.updateAvailability(property.id, false);

    return claim;
  }
}

module.exports = { ClaimPropertyUseCase };
