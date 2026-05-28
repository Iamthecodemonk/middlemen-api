const { successResponse } = require("../../../shared/utils/apiResponse");

class UploadController {
  static async enqueueImage(request, reply) {
    // expect multipart file field named 'file'
    const file = await request.file();
    if (!file) {
      return reply.code(422).send({
        success: false,
        statusCode: 422,
        message: "file is required"
      });
    }

    const chunks = [];
    for await (const chunk of file.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const base64 = buffer.toString("base64");

    const queue = request.server.container.queues.imageQueue;
    const job = await queue.add("upload", {
      userId: request.auth.user.id,
      fileBase64: base64,
      filename: file.filename || `avatar_${Date.now()}`
    });

    reply.code(202).send(
      successResponse({
        statusCode: 202,
        message: "Image upload queued",
        data: {
          jobId: job.id,
          status: "queued",
          attemptsAllowed: job.opts.attempts
        }
      })
    );
  }

  static async getJobStatus(request, reply) {
    const { jobId } = request.params;
    const queue = request.server.container.queues.imageQueue;
    const job = await queue.getJob(jobId);
    if (!job) {
      return reply.code(404).send({
        success: false,
        statusCode: 404,
        message: "job not found"
      });
    }

    const state = await job.getState();
    const result = job.returnvalue || null;
    reply.send(
      successResponse({
        message: "Image upload job status fetched",
        data: {
          id: job.id,
          state,
          imageUrl: result?.url || null,
          result,
          attemptsMade: job.attemptsMade,
          attemptsAllowed: job.opts.attempts,
          failedReason: job.failedReason || null,
          finishedOn: job.finishedOn || null,
          processedOn: job.processedOn || null
        }
      })
    );
  }
}

module.exports = { UploadController };
