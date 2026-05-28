const { AppError } = require("../../../shared/errors/AppError");

class RegisterUserUseCase {
  constructor({ userRepository, passwordHasher, otpService, authDeliveryService }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.otpService = otpService;
    this.authDeliveryService = authDeliveryService;
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
    const user = await this.userRepository.create({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      role: input.role,
      passwordHash,
      mfaChannel: input.mfaChannel
    });

    const destination = user.mfaChannel === "sms" ? user.phone : user.email;
    const otp = await this.otpService.issue(user.id, user.mfaChannel, { destination });
    if (!otp.deliveredByProvider) {
      await this.authDeliveryService.sendOtp({
        channel: user.mfaChannel,
        destination,
        code: otp.code
      });
    }

    return {
      user: sanitizeUser(user),
      verificationRequired: true,
      message: "Registration created. Verify OTP to activate the account."
    };
  }
}

function sanitizeUser(user) {
  const { passwordHash, googleId, ...safeUser } = user;
  return safeUser;
}

module.exports = { RegisterUserUseCase };
