const { AppError } = require("../../../shared/errors/AppError");

function validate(schema) {
  return async (request) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      throw new AppError(result.error.issues[0]?.message || "Invalid request", 422);
    }

    request.body = result.data;
  };
}

module.exports = { validate };
