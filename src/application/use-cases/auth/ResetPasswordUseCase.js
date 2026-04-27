const { AppError } = require("../../../shared/errors/AppError");

class ResetPasswordUseCase {
  constructor({
    passwordResetTokenRepository,
    userRepository,
    passwordHasher,
    refreshTokenRepository
  }) {
    this.passwordResetTokenRepository = passwordResetTokenRepository;
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  async execute({ token, password }) {
    const tokenRecord = await this.passwordResetTokenRepository.findValid(token);
    if (!tokenRecord) {
      throw new AppError("Reset token is invalid or expired", 400);
    }

    const passwordHash = await this.passwordHasher.hash(password);
    await this.userRepository.updatePassword(tokenRecord.user_id, passwordHash);
    await this.passwordResetTokenRepository.markUsed(token);
    await this.refreshTokenRepository.revokeAllForUser(tokenRecord.user_id);

    return { message: "Password reset successful" };
  }
}

module.exports = { ResetPasswordUseCase };
