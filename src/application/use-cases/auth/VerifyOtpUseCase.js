const { AppError } = require("../../../shared/errors/AppError");

class VerifyOtpUseCase {
  constructor({
    db,
    userRepository,
    pendingRegistrationRepository,
    otpService,
    jwtService,
    refreshTokenRepository
  }) {
    this.db = db;
    this.userRepository = userRepository;
    this.pendingRegistrationRepository = pendingRegistrationRepository;
    this.otpService = otpService;
    this.jwtService = jwtService;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  async execute({ identifier, code, ipAddress, userAgent }) {
    const pendingRegistration = await this.pendingRegistrationRepository.findByIdentifier(identifier);
    if (pendingRegistration) {
      await this.otpService.verify(pendingRegistration.id, code);

      const verifiedUser = await this.db.transaction(async (trx) => {
        const createdUser = await this.userRepository.createFromPendingRegistration(
          pendingRegistration,
          trx
        );
        await this.pendingRegistrationRepository.deleteById(pendingRegistration.id, trx);
        return createdUser;
      });

      return this.createSession({
        user: verifiedUser,
        ipAddress,
        userAgent
      });
    }

    const user = await this.userRepository.findByIdentifier(identifier);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    await this.otpService.verify(user.id, code);
    const verifiedUser = user.isVerified ? user : await this.userRepository.markVerified(user.id);

    return this.createSession({
      user: verifiedUser,
      ipAddress,
      userAgent
    });
  }

  async createSession({ user, ipAddress, userAgent }) {
    const accessToken = this.jwtService.signAccessToken(user);
    const refreshToken = this.jwtService.signRefreshToken(user);
    const refreshPayload = this.jwtService.verifyRefreshToken(refreshToken);

    await this.refreshTokenRepository.create({
      userId: user.id,
      refreshToken,
      expiresAt: new Date(refreshPayload.exp * 1000),
      ipAddress,
      userAgent
    });

    return {
      user: sanitizeUser(user),
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
