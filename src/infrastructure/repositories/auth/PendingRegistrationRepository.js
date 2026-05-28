class PendingRegistrationRepository {
  constructor(db) {
    this.db = db;
  }

  async upsert({ fullName, email, phone, role, passwordHash, mfaChannel, expiresAt }) {
    const existing = await this.findByEmailOrPhone({ email, phone });

    if (existing) {
      const [row] = await this.db("pending_user_registrations")
        .where({ id: existing.id })
        .update({
          full_name: fullName,
          email: email || null,
          phone,
          role,
          password_hash: passwordHash,
          mfa_channel: mfaChannel,
          expires_at: expiresAt,
          updated_at: this.db.fn.now()
        })
        .returning("*");

      return this.map(row);
    }

    const [row] = await this.db("pending_user_registrations")
      .insert({
        full_name: fullName,
        email: email || null,
        phone,
        role,
        password_hash: passwordHash,
        mfa_channel: mfaChannel,
        expires_at: expiresAt
      })
      .returning("*");

    return this.map(row);
  }

  async findByIdentifier(identifier) {
    const row = await this.db("pending_user_registrations")
      .where({ email: identifier })
      .orWhere({ phone: identifier })
      .first();

    return row ? this.map(row) : null;
  }

  async findByEmailOrPhone({ email, phone }) {
    const query = this.db("pending_user_registrations").where({ phone });

    if (email) {
      query.orWhere({ email });
    }

    const row = await query.first();
    return row ? this.map(row) : null;
  }

  async deleteById(id, trx = this.db) {
    await trx("pending_user_registrations").where({ id }).del();
  }

  map(row) {
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      passwordHash: row.password_hash,
      mfaChannel: row.mfa_channel,
      expiresAt: row.expires_at,
      createdAt: row.created_at
    };
  }
}

module.exports = { PendingRegistrationRepository };
