const { Money } = require("../value-objects/Money");

class LeaseClaim {
  constructor({
    id,
    propertyId,
    tenantId,
    claimAmount,
    escrowStatus = "held",
    expiresAt
  }) {
    this.id = id;
    this.propertyId = propertyId;
    this.tenantId = tenantId;
    this.claimAmount = new Money(claimAmount);
    this.escrowStatus = escrowStatus;
    this.expiresAt = expiresAt;
  }
}

module.exports = { LeaseClaim };
