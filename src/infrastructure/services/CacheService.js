class CacheService {
  constructor(redis) {
    this.redis = redis;
  }

  async getJson(key) {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async setJson(key, value, ttlSeconds = 300) {
    await this.redis.set(key, JSON.stringify(value), {
      EX: ttlSeconds
    });
  }
}

module.exports = { CacheService };
