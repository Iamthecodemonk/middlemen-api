class UserVerificationRepository {
  constructor(db) {
    this.db = db;
  }

  async recordNinVerification({ userId, nin, status, provider, providerResponse }) {
    const [row] = await this.db("user_verifications")
      .insert({
        user_id: userId,
        verification_type: "nin",
        nin_number: nin,
        status,
        verified_at: status === "verified" ? this.db.fn.now() : null,
        provider,
        provider_response: providerResponse
      })
      .returning("*");

    return this.map(row);
  }

  async recordLivenessVerification({
    userId,
    status,
    provider,
    providerResponse,
    rejectedReason
  }) {
    const [row] = await this.db("user_verifications")
      .insert({
        user_id: userId,
        verification_type: "liveness",
        status,
        verified_at: status === "verified" ? this.db.fn.now() : null,
        rejected_reason: rejectedReason,
        provider,
        provider_response: providerResponse
      })
      .returning("*");

    return this.map(row);
  }

  async hasVerifiedType({ userId, verificationType }) {
    const row = await this.db("user_verifications")
      .where({
        user_id: userId,
        verification_type: verificationType,
        status: "verified"
      })
      .first("id");

    return Boolean(row);
  }

  async countVerifications({ userId, verificationType }) {
    const [row] = await this.db("user_verifications")
      .where({
        user_id: userId,
        verification_type: verificationType
      })
      .count({ count: "*" });

    return Number(row.count || 0);
  }

  map(row) {
    return {
      id: row.id,
      userId: row.user_id,
      verificationType: row.verification_type,
      ninNumber: row.nin_number,
      status: row.status,
      provider: row.provider,
      verifiedAt: row.verified_at,
      rejectedReason: row.rejected_reason,
      createdAt: row.created_at
    };
  }
}

module.exports = { UserVerificationRepository };
