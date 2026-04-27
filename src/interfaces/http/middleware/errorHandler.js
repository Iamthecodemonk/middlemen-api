function errorHandler(error, _req, reply) {
  const statusCode = error.statusCode || 500;
  reply.code(statusCode).send({
    message: error.message || "Internal server error"
  });
}

module.exports = { errorHandler };
