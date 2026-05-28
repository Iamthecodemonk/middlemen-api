const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const { env } = require("../config/env");
const { CloudinaryService } = require("../services/CloudinaryService");
const { createKnexClient } = require("../db/knex");
const { UserRepository } = require("../repositories/auth/UserRepository");

function startImageUploadWorker() {
  const connection = new IORedis(env.redisUrl, { maxRetriesPerRequest: null });
  const worker = new Worker(
    "image-uploads",
    async (job) => {
      const { userId, fileBase64, filename } = job.data;
      const buffer = Buffer.from(fileBase64, "base64");

      const cloudinary = new CloudinaryService({
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET
      });

      const uploadResult = await cloudinary.uploadBuffer(buffer, filename);

      // update user's avatar_url in DB
      const knex = createKnexClient();
      const userRepo = new UserRepository(knex);
      await userRepo.updateAvatar(userId, uploadResult.secure_url);
      await knex.destroy();

      return { url: uploadResult.secure_url };
    },
    {
      connection,
      concurrency: env.imageUploadWorkerConcurrency
    }
  );

  worker.on("completed", (job, result) => {
    console.log("Image upload job completed", {
      jobId: job.id,
      userId: job.data.userId,
      attemptsMade: job.attemptsMade,
      url: result?.url
    });
  });

  worker.on("failed", (job, err) => {
    console.error("Image upload job failed", {
      jobId: job?.id,
      userId: job?.data?.userId,
      attemptsMade: job?.attemptsMade,
      attemptsConfigured: job?.opts?.attempts,
      failedReason: err.message,
      stack: err.stack
    });
  });

  return worker;
}

module.exports = { startImageUploadWorker };
