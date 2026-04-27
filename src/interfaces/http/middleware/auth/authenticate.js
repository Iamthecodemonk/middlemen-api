const { AppError } = require("../../../../shared/errors/AppError");

async function authenticate(request) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("Authorization token is required", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = request.server.container.jwtService.verifyAccessToken(token);
    const user = await request.server.container.repositories.userRepository.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new AppError("User is not authorized", 401);
    }

    const { passwordHash, ...safeUser } = user;
    request.auth = {
      token,
      user: safeUser
    };
  } catch (error) {
    throw error.statusCode ? error : new AppError("Invalid or expired access token", 401);
  }
}

module.exports = { authenticate };
