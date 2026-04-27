const { AppError } = require("../../../shared/errors/AppError");

class RefreshSessionUseCase {
  constructor({ userRepository, jwtService, refreshTokenRepository }) {
    this.userRepository = userRepository;
    this.jwtService = jwtService;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  async execute({ refreshToken, ipAddress, userAgent }) {
    let payload;

    try {
      payload = this.jwtService.verifyRefreshToken(refreshToken);
    } catch (_error) {
      throw new AppError("Invalid refresh token", 401);
    }

    const storedToken = await this.refreshTokenRepository.findActiveByToken(refreshToken);
    if (!storedToken) {
      throw new AppError("Refresh token is not active", 401);
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    await this.refreshTokenRepository.revokeByToken(refreshToken);

    const nextAccessToken = this.jwtService.signAccessToken(user);
    const nextRefreshToken = this.jwtService.signRefreshToken(user);
    const nextPayload = this.jwtService.verifyRefreshToken(nextRefreshToken);

    await this.refreshTokenRepository.create({
      userId: user.id,
      refreshToken: nextRefreshToken,
      expiresAt: new Date(nextPayload.exp * 1000),
      ipAddress,
      userAgent
    });

    return {
      user: sanitizeUser(user),
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken
    };
  }
}

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

module.exports = { RefreshSessionUseCase };
