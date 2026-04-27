const { hashText } = require("../../../shared/utils/hashText");

class RefreshTokenRepository {
  constructor(db) {
    this.db = db;
  }

  async create({ userId, refreshToken, expiresAt, ipAddress, userAgent }) {
    const tokenHash = hashText(refreshToken);

    await this.db("refresh_tokens").insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_by_ip: ipAddress,
      user_agent: userAgent
    });
  }

  async findActiveByToken(refreshToken) {
    const tokenHash = hashText(refreshToken);
    const row = await this.db("refresh_tokens")
      .where({ token_hash: tokenHash })
      .whereNull("revoked_at")
      .andWhere("expires_at", ">", this.db.fn.now())
      .first();

    return row || null;
  }

  async revokeByToken(refreshToken) {
    const tokenHash = hashText(refreshToken);
    await this.db("refresh_tokens")
      .where({ token_hash: tokenHash })
      .whereNull("revoked_at")
      .update({ revoked_at: this.db.fn.now() });
  }

  async revokeAllForUser(userId) {
    await this.db("refresh_tokens")
      .where({ user_id: userId })
      .whereNull("revoked_at")
      .update({ revoked_at: this.db.fn.now() });
  }
}

module.exports = { RefreshTokenRepository };
