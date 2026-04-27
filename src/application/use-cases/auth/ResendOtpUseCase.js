const { AppError } = require("../../../shared/errors/AppError");

class ResendOtpUseCase {
  constructor({ userRepository, otpService, authDeliveryService }) {
    this.userRepository = userRepository;
    this.otpService = otpService;
    this.authDeliveryService = authDeliveryService;
  }

  async execute({ identifier }) {
    const user = await this.userRepository.findByIdentifier(identifier);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    await this.otpService.assertCanResend(user.id);
    const code = await this.otpService.issue(user.id, user.mfaChannel);

    await this.authDeliveryService.sendOtp({
      channel: user.mfaChannel,
      destination: user.mfaChannel === "sms" ? user.phone : user.email,
      code
    });

    return { message: "OTP resent successfully" };
  }
}

module.exports = { ResendOtpUseCase };
