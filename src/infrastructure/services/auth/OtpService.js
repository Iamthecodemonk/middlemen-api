const { randomInt } = require("crypto");
const { AppError } = require("../../../shared/errors/AppError");

class OtpService {
  constructor(redis, { ttlSeconds, resendCooldownSeconds }) {
    this.redis = redis;
    this.ttlSeconds = ttlSeconds;
    this.resendCooldownSeconds = resendCooldownSeconds;
  }

  buildOtpKey(userId) {
    return `auth:otp:${userId}`;
  }

  buildMetaKey(userId) {
    return `auth:otp:meta:${userId}`;
  }

  async issue(userId, channel) {
    const otp = String(randomInt(100000, 1000000));
    const otpKey = this.buildOtpKey(userId);
    const metaKey = this.buildMetaKey(userId);

    await this.redis.set(
      otpKey,
      JSON.stringify({
        code: otp,
        channel
      }),
      { EX: this.ttlSeconds }
    );

    await this.redis.set(
      metaKey,
      JSON.stringify({
        lastSentAt: Date.now(),
        channel
      }),
      { EX: this.ttlSeconds }
    );

    return otp;
  }

  async assertCanResend(userId) {
    const metaRaw = await this.redis.get(this.buildMetaKey(userId));
    if (!metaRaw) {
      return;
    }

    const meta = JSON.parse(metaRaw);
    const cooldownEndsAt = meta.lastSentAt + this.resendCooldownSeconds * 1000;
    if (Date.now() < cooldownEndsAt) {
      throw new AppError("OTP resend is limited to once every 60 seconds", 429);
    }
  }

  async verify(userId, code) {
    const raw = await this.redis.get(this.buildOtpKey(userId));
    if (!raw) {
      throw new AppError("OTP is invalid or expired", 400);
    }

    const payload = JSON.parse(raw);
    if (payload.code !== code) {
      throw new AppError("OTP is invalid or expired", 400);
    }

    await this.redis.del(this.buildOtpKey(userId));
    await this.redis.del(this.buildMetaKey(userId));

    return payload;
  }
}

module.exports = { OtpService };
