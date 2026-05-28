const { env } = require("../../../infrastructure/config/env");
const { errorResponse } = require("../../../shared/utils/apiResponse");

function errorHandler(error, request, reply) {
  const statusCode = error.statusCode || 500;
  let requestId;

  if (env.nodeEnv !== "production" && request.id) {
    requestId = request.id;
  }

  request.log?.error(
    {
      err: error,
      statusCode,
      method: request.method,
      url: request.url,
      cause: error.cause
        ? {
            name: error.cause.name,
            message: error.cause.message,
            code: error.cause.code,
            command: error.cause.command
          }
        : undefined,
      details: error.details
    },
    "request failed"
  );

  reply.code(statusCode).send(
    errorResponse({
      statusCode,
      message: error.message || "Internal server error",
      requestId
    })
  );
}

module.exports = { errorHandler };
