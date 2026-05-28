const { AppError } = require("../../../shared/errors/AppError");

class RegisterUserUseCase {
  constructor({
    userRepository,
    pendingRegistrationRepository,
    passwordHasher,
    otpService,
    authDeliveryService,
    otpTtlSeconds
  }) {
    this.userRepository = userRepository;
    this.pendingRegistrationRepository = pendingRegistrationRepository;
    this.passwordHasher = passwordHasher;
    this.otpService = otpService;
    this.authDeliveryService = authDeliveryService;
    this.otpTtlSeconds = otpTtlSeconds;
  }

  async execute(input) {
    const [emailTaken, phoneTaken] = await Promise.all([
      this.userRepository.isEmailTaken(input.email),
      this.userRepository.isPhoneTaken(input.phone)
    ]);

    if (emailTaken) {
      throw new AppError("Email is already in use", 409);
    }

    if (phoneTaken) {
      throw new AppError("Phone is already in use", 409);
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const pendingRegistration = await this.pendingRegistrationRepository.upsert({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      role: input.role,
      passwordHash,
      mfaChannel: input.mfaChannel,
      expiresAt: new Date(Date.now() + this.otpTtlSeconds * 1000)
    });

    const destination =
      pendingRegistration.mfaChannel === "sms"
        ? pendingRegistration.phone
        : pendingRegistration.email;
    const otp = await this.otpService.issue(pendingRegistration.id, pendingRegistration.mfaChannel, {
      destination
    });
    if (!otp.deliveredByProvider) {
      await this.authDeliveryService.sendOtp({
        channel: pendingRegistration.mfaChannel,
        destination,
        code: otp.code
      });
    }

    return {
      pendingRegistration: sanitizePendingRegistration(pendingRegistration),
      verificationRequired: true,
      message: "Registration created. Verify OTP to activate the account."
    };
  }
}

function sanitizePendingRegistration(pendingRegistration) {
  const { passwordHash, ...safePendingRegistration } = pendingRegistration;
  return safePendingRegistration;
}

module.exports = { RegisterUserUseCase };
