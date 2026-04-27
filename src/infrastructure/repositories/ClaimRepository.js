class ClaimRepository {
  constructor(db) {
    this.db = db;
  }

  async create(claim) {
    await this.db("property_claims").insert({
      id: claim.id,
      property_id: claim.propertyId,
      tenant_id: claim.tenantId,
      claim_amount: claim.claimAmount.amount,
      escrow_status: claim.escrowStatus,
      expires_at: claim.expiresAt
    });
    return claim;
  }
}

module.exports = { ClaimRepository };
