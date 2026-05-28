const { AppError } = require("../../../shared/errors/AppError");

class VerifyOtpUseCase {
  constructor({ userRepository, otpService, jwtService, refreshTokenRepository }) {
    this.userRepository = userRepository;
    this.otpService = otpService;
    this.jwtService = jwtService;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  async execute({ identifier, code, ipAddress, userAgent }) {
    const user = await this.userRepository.findByIdentifier(identifier);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    await this.otpService.verify(user.id, code);
    const verifiedUser = user.isVerified ? user : await this.userRepository.markVerified(user.id);

    const accessToken = this.jwtService.signAccessToken(verifiedUser);
    const refreshToken = this.jwtService.signRefreshToken(verifiedUser);
    const refreshPayload = this.jwtService.verifyRefreshToken(refreshToken);

    await this.refreshTokenRepository.create({
      userId: verifiedUser.id,
      refreshToken,
      expiresAt: new Date(refreshPayload.exp * 1000),
      ipAddress,
      userAgent
    });

    return {
      user: sanitizeUser(verifiedUser),
      accessToken,
      refreshToken
    };
  }
}

function sanitizeUser(user) {
  const { passwordHash, googleId, ...safeUser } = user;
  return safeUser;
}

module.exports = { VerifyOtpUseCase };
