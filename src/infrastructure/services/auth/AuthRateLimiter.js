const { AppError } = require("../../../shared/errors/AppError");

class AuthRateLimiter {
  constructor(redis, { maxAttempts, windowSeconds }) {
    this.redis = redis;
    this.maxAttempts = maxAttempts;
    this.windowSeconds = windowSeconds;
  }

  buildKey(ipAddress) {
    return `auth:login:attempts:${ipAddress || "unknown"}`;
  }

  async consume(ipAddress) {
    const key = this.buildKey(ipAddress);
    const attempts = await this.redis.incr(key);

    if (attempts === 1) {
      await this.redis.expire(key, this.windowSeconds);
    }

    if (attempts > this.maxAttempts) {
      throw new AppError("Too many login attempts. Try again later.", 429);
    }
  }

  async reset(ipAddress) {
    await this.redis.del(this.buildKey(ipAddress));
  }
}

module.exports = { AuthRateLimiter };
