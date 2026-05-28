const { UserAccount } = require("../../../domain/entities/auth/UserAccount");

class UserRepository {
  constructor(db) {
    this.db = db;
  }

  async isEmailTaken(email) {
    if (!email) {
      return false;
    }

    const result = await this.db("users").where({ email }).first("id");
    return Boolean(result);
  }

  async isPhoneTaken(phone) {
    const result = await this.db("users").where({ phone }).first("id");
    return Boolean(result);
  }

  async create({ fullName, email, phone, role, passwordHash, mfaChannel }) {
    const [row] = await this.db("users")
      .insert({
        full_name: fullName,
        email: email || null,
        phone,
        role,
        password_hash: passwordHash,
        mfa_channel: mfaChannel,
        is_verified: false
      })
      .returning("*");

    return this.mapWithSensitive(row);
  }

  async createFromPendingRegistration(pendingRegistration, trx = this.db) {
    const [row] = await trx("users")
      .insert({
        full_name: pendingRegistration.fullName,
        email: pendingRegistration.email || null,
        phone: pendingRegistration.phone,
        role: pendingRegistration.role,
        password_hash: pendingRegistration.passwordHash,
        mfa_channel: pendingRegistration.mfaChannel,
        is_verified: true,
        last_auth_provider: "password"
      })
      .returning("*");

    return this.mapWithSensitive(row);
  }

  async createGoogleUser({ fullName, email, phone, role, googleId, avatarUrl }) {
    const [row] = await this.db("users")
      .insert({
        full_name: fullName,
        email,
        phone,
        role,
        google_id: googleId,
        avatar_url: avatarUrl,
        last_auth_provider: "google",
        mfa_channel: "email",
        is_verified: true
      })
      .returning("*");

    return this.mapWithSensitive(row);
  }

  async findByEmail(email) {
    if (!email) {
      return null;
    }

    const row = await this.db("users").where({ email }).first();
    return row ? this.mapWithSensitive(row) : null;
  }

  async findByGoogleId(googleId) {
    const row = await this.db("users").where({ google_id: googleId }).first();
    return row ? this.mapWithSensitive(row) : null;
  }

  async findByIdentifier(identifier) {
    const row = await this.db("users")
      .where({ email: identifier })
      .orWhere({ phone: identifier })
      .first();

    return row ? this.mapWithSensitive(row) : null;
  }

  async findById(id) {
    const row = await this.db("users").where({ id }).first();
    return row ? this.mapWithSensitive(row) : null;
  }

  async markVerified(userId) {
    const [row] = await this.db("users")
      .where({ id: userId })
      .update({
        is_verified: true,
        updated_at: this.db.fn.now()
      })
      .returning("*");

    return this.mapWithSensitive(row);
  }

  async updateLastLogin(userId) {
    await this.db("users").where({ id: userId }).update({
      last_login_at: this.db.fn.now(),
      updated_at: this.db.fn.now()
    });
  }

  async updatePassword(userId, passwordHash) {
    await this.db("users").where({ id: userId }).update({
      password_hash: passwordHash,
      updated_at: this.db.fn.now()
    });
  }

  async linkGoogleAccount(userId, { googleId, avatarUrl }) {
    const [row] = await this.db("users")
      .where({ id: userId })
      .update({
        google_id: googleId,
        avatar_url: avatarUrl,
        last_auth_provider: "google",
        is_verified: true,
        updated_at: this.db.fn.now()
      })
      .returning("*");

    return this.mapWithSensitive(row);
  }

  async updateAvatar(userId, avatarUrl) {
    const [row] = await this.db("users")
      .where({ id: userId })
      .update({ avatar_url: avatarUrl, updated_at: this.db.fn.now() })
      .returning("*");

    return row ? this.mapWithSensitive(row) : null;
  }

  mapWithSensitive(row) {
    const user = new UserAccount({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      userTier: row.user_tier,
      isVerified: row.is_verified,
      mfaChannel: row.mfa_channel,
      googleId: row.google_id,
      avatarUrl: row.avatar_url,
      isActive: row.is_active,
      trustScore: row.trust_score,
      createdAt: row.created_at
    });

    return {
      ...user,
      passwordHash: row.password_hash
    };
  }
}

module.exports = { UserRepository };
