const { createClient } = require("redis");
const { env } = require("../config/env");

function createRedisClient() {
  const client = createClient({
    url: env.redisUrl
  });

  client.on("error", (error) => {
    console.error("Redis error", error);
  });

  return client;
}

module.exports = { createRedisClient };
