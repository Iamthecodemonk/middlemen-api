const { Queue } = require("bullmq");
const IORedis = require("ioredis");
const { env } = require("../config/env");

let queue;

function createImageQueue() {
  if (queue) return queue;

  const connection = new IORedis(env.redisUrl, { maxRetriesPerRequest: null });
  queue = new Queue("image-uploads", {
    connection,
    defaultJobOptions: {
      attempts: env.imageUploadAttempts,
      backoff: {
        type: "exponential",
        delay: env.imageUploadBackoffMs
      },
      removeOnComplete: {
        count: env.imageUploadRemoveOnComplete
      },
      removeOnFail: {
        count: env.imageUploadRemoveOnFail
      }
    }
  });
  return queue;
}

module.exports = { createImageQueue };
