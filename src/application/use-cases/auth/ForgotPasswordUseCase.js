const { v4: uuidv4 } = require("uuid");
const { AppError } = require("../../../shared/errors/AppError");
const { addSeconds } = require("../../../shared/utils/addSeconds");

class ForgotPasswordUseCase {
  constructor({
    userRepository,
    passwordResetTokenRepository,
    authDeliveryService
  }) {
    this.userRepository = userRepository;
    this.passwordResetTokenRepository = passwordResetTokenRepository;
    this.authDeliveryService = authDeliveryService;
  }

  async execute({ identifier }) {
    const user = await this.userRepository.findByIdentifier(identifier);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const resetToken = uuidv4();
    await this.passwordResetTokenRepository.create({
      userId: user.id,
      resetToken,
      expiresAt: addSeconds(new Date(), 15 * 60),
      deliveryChannel: user.mfaChannel
    });

    await this.authDeliveryService.sendPasswordReset({
      channel: user.mfaChannel,
      destination: user.mfaChannel === "sms" ? user.phone : user.email,
      token: resetToken
    });

    return { message: "Password reset instructions sent" };
  }
}

module.exports = { ForgotPasswordUseCase };
