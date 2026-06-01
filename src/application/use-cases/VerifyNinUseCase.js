const { AppError } = require("../../shared/errors/AppError");
const { successResponse } = require("../../shared/utils/apiResponse");

class VerifyNinUseCase {
  constructor({ userRepository, userVerificationRepository, dojahKycService }) {
    this.userRepository = userRepository;
    this.userVerificationRepository = userVerificationRepository;
    this.dojahKycService = dojahKycService;
  }

  async execute({ userId, nin }) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const profile = await this.dojahKycService.lookupNin(nin);
    const verification = await this.userVerificationRepository.recordNinVerification({
      userId,
      nin,
      status: "verified",
      provider: "dojah",
      providerResponse: profile
    });
    const livenessVerified = await this.userVerificationRepository.hasVerifiedType({
      userId,
      verificationType: "liveness"
    });
    const verifiedUser = livenessVerified
      ? await this.userRepository.markIdentityVerified(userId)
      : user;

    return successResponse({
      message: livenessVerified
        ? "NIN verified successfully. Account KYC is complete."
        : "NIN verified successfully. Liveness check is still required.",
      data: {
        fullyVerified: livenessVerified,
        user: sanitizeUser(verifiedUser),
        verification: {
          id: verification.id,
          status: verification.status,
          verificationType: verification.verificationType,
          verifiedAt: verification.verifiedAt
        },
        ninProfile: sanitizeNinProfile(profile)
      }
    });
  }
}

function sanitizeUser(user) {
  const { passwordHash, googleId, ...safeUser } = user;
  return safeUser;
}

function sanitizeNinProfile(profile) {
  return {
    firstName: profile.first_name || null,
    middleName: profile.middle_name || null,
    lastName: profile.last_name || null,
    gender: profile.gender || null,
    dateOfBirth: profile.date_of_birth || null,
    phoneNumber: profile.phone_number || null
  };
}

module.exports = { VerifyNinUseCase };
