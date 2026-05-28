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
    const destination = user.mfaChannel === "sms" ? user.phone : user.email;
    const otp = await this.otpService.issue(user.id, user.mfaChannel, { destination });

    if (!otp.deliveredByProvider) {
      await this.authDeliveryService.sendOtp({
        channel: user.mfaChannel,
        destination,
        code: otp.code
      });
    }

    return { message: "OTP resent successfully" };
  }
}

module.exports = { ResendOtpUseCase };
