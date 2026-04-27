const { AppError } = require("../../../../shared/errors/AppError");

function authorizeRoles(...roles) {
  return async (request) => {
    if (!request.auth?.user) {
      throw new AppError("Authentication is required", 401);
    }

    if (!roles.includes(request.auth.user.role)) {
      throw new AppError("You do not have access to this resource", 403);
    }
  };
}

module.exports = { authorizeRoles };
