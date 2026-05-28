const { AppError } = require("../../../shared/errors/AppError");

class GoogleAuthUseCase {
  constructor({ userRepository, googleAuthService, jwtService, refreshTokenRepository }) {
    this.userRepository = userRepository;
    this.googleAuthService = googleAuthService;
    this.jwtService = jwtService;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  async execute({ idToken, role = "user", phone, ipAddress, userAgent }) {
    const profile = await this.googleAuthService.verifyIdToken(idToken);
    let user = await this.userRepository.findByGoogleId(profile.googleId);

    if (!user && profile.email) {
      user = await this.userRepository.findByEmail(profile.email);
    }

    if (user) {
      if (!user.googleId) {
        user = await this.userRepository.linkGoogleAccount(user.id, {
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl
        });
      }

      if (!user.isVerified) {
        user = await this.userRepository.markVerified(user.id);
      }
    } else {
      if (!phone) {
        throw new AppError("Phone is required when creating a Google account", 422);
      }

      const phoneTaken = await this.userRepository.isPhoneTaken(phone);
      if (phoneTaken) {
        throw new AppError("Phone is already in use", 409);
      }

      user = await this.userRepository.createGoogleUser({
        fullName: profile.fullName,
        email: profile.email,
        phone,
        role,
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl
      });
    }

    await this.userRepository.updateLastLogin(user.id);

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

module.exports = { GoogleAuthUseCase };
