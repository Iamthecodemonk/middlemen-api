class PasswordResetTokenRepository {
  constructor(db) {
    this.db = db;
  }

  async create({ userId, resetToken, expiresAt, deliveryChannel }) {
    await this.db("password_reset_tokens").insert({
      user_id: userId,
      reset_token: resetToken,
      expires_at: expiresAt,
      delivery_channel: deliveryChannel
    });
  }

  async findValid(resetToken) {
    const row = await this.db("password_reset_tokens")
      .where({ reset_token: resetToken })
      .whereNull("used_at")
      .andWhere("expires_at", ">", this.db.fn.now())
      .first();

    return row || null;
  }

  async markUsed(resetToken) {
    await this.db("password_reset_tokens")
      .where({ reset_token: resetToken })
      .whereNull("used_at")
      .update({ used_at: this.db.fn.now() });
  }
}

module.exports = { PasswordResetTokenRepository };
