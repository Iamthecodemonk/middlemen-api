const { AppError } = require("../../../shared/errors/AppError");

class LoginUserUseCase {
  constructor({
    userRepository,
    passwordHasher,
    jwtService,
    refreshTokenRepository,
    authRateLimiter
  }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.jwtService = jwtService;
    this.refreshTokenRepository = refreshTokenRepository;
    this.authRateLimiter = authRateLimiter;
  }

  async execute({ identifier, password, ipAddress, userAgent }) {
    await this.authRateLimiter.consume(ipAddress);

    const user = await this.userRepository.findByIdentifier(identifier);
    if (!user || !user.passwordHash) {
      throw new AppError("Invalid credentials", 401);
    }

    const matches = await this.passwordHasher.compare(password, user.passwordHash);
    if (!matches) {
      throw new AppError("Invalid credentials", 401);
    }

    if (!user.isVerified) {
      throw new AppError("Account is not verified yet", 403);
    }

    const accessToken = this.jwtService.signAccessToken(user);
    const refreshToken = this.jwtService.signRefreshToken(user);
    const refreshPayload = this.jwtService.verifyRefreshToken(refreshToken);

    await Promise.all([
      this.refreshTokenRepository.create({
        userId: user.id,
        refreshToken,
        expiresAt: new Date(refreshPayload.exp * 1000),
        ipAddress,
        userAgent
      }),
      this.userRepository.updateLastLogin(user.id),
      this.authRateLimiter.reset(ipAddress)
    ]);

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

module.exports = { LoginUserUseCase };
