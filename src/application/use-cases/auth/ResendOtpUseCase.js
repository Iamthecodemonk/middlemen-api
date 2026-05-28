const { AppError } = require("../../../shared/errors/AppError");

class ResendOtpUseCase {
  constructor({ userRepository, pendingRegistrationRepository, otpService, authDeliveryService }) {
    this.userRepository = userRepository;
    this.pendingRegistrationRepository = pendingRegistrationRepository;
    this.otpService = otpService;
    this.authDeliveryService = authDeliveryService;
  }

  async execute({ identifier }) {
    const pendingRegistration = await this.pendingRegistrationRepository.findByIdentifier(identifier);
    if (pendingRegistration) {
      await this.sendOtp(pendingRegistration);
      return { message: "OTP resent successfully" };
    }

    const user = await this.userRepository.findByIdentifier(identifier);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    await this.sendOtp(user);

    return { message: "OTP resent successfully" };
  }

  async sendOtp(registration) {
    await this.otpService.assertCanResend(registration.id);
    const destination = registration.mfaChannel === "sms" ? registration.phone : registration.email;
    const otp = await this.otpService.issue(registration.id, registration.mfaChannel, {
      destination
    });

    if (!otp.deliveredByProvider) {
      await this.authDeliveryService.sendOtp({
        channel: registration.mfaChannel,
        destination,
        code: otp.code
      });
    }
  }
}

module.exports = { ResendOtpUseCase };
