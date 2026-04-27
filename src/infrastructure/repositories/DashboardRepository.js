class DashboardRepository {
  constructor(db) {
    this.db = db;
  }

  async getSummary(actorType, actorId) {
    if (actorType === "owner") {
      return this.getOwnerSummary(actorId);
    }

    return this.getTenantSummary(actorId);
  }

  async getOwnerSummary(ownerId) {
    const properties = await this.db("properties")
      .where({ owner_id: ownerId })
      .count("* as total")
      .count({ occupied: this.db.raw("CASE WHEN is_available = false THEN 1 END") })
      .first();

    const maintenance = await this.db("maintenance_requests")
      .where({ owner_id: ownerId, status: "pending" })
      .count("* as pending")
      .first();

    const activeLeases = await this.db("leases")
      .where({ owner_id: ownerId, is_active: true })
      .sum({ revenue: "monthly_rent" })
      .first();

    return {
      actorType: "owner",
      actorId: ownerId,
      totalListings: Number(properties?.total || 0),
      occupiedListings: Number(properties?.occupied || 0),
      pendingMaintenance: Number(maintenance?.pending || 0),
      annualRevenueEstimate: Number(activeLeases?.revenue || 0) * 12
    };
  }

  async getTenantSummary(tenantId) {
    const claims = await this.db("property_claims")
      .where({ tenant_id: tenantId, escrow_status: "pending" })
      .count("* as active_claims")
      .first();

    const wallet = await this.db("users")
      .select("rent_wallet_balance")
      .where({ id: tenantId })
      .first();

    return {
      actorType: "tenant",
      actorId: tenantId,
      activeClaims: Number(claims?.active_claims || 0),
      rentWalletBalance: Number(wallet?.rent_wallet_balance || 0),
      nextAutoDebit: null
    };
  }
}

module.exports = { DashboardRepository };
