class AppError extends Error {
  constructor(message, statusCode = 400, options = {}) {
    super(message);
    this.statusCode = statusCode;
    this.cause = options.cause;
    this.details = options.details;
  }
}

module.exports = { AppError };
