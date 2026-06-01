const { successResponse } = require("../../shared/utils/apiResponse");

class GetKycStatusUseCase {
  constructor({ userVerificationRepository }) {
    this.userVerificationRepository = userVerificationRepository;
  }

  async execute({ userId, maxLivenessAttempts }) {
    const [ninVerified, livenessVerified, livenessAttempts] = await Promise.all([
      this.userVerificationRepository.hasVerifiedType({ userId, verificationType: "nin" }),
      this.userVerificationRepository.hasVerifiedType({ userId, verificationType: "liveness" }),
      this.userVerificationRepository.countVerifications({
        userId,
        verificationType: "liveness"
      })
    ]);

    return successResponse({
      message: "KYC status fetched",
      data: {
        fullyVerified: ninVerified && livenessVerified,
        checks: {
          nin: ninVerified ? "verified" : "pending",
          liveness: livenessVerified ? "verified" : "pending"
        },
        liveness: {
          attemptsMade: livenessAttempts,
          attemptsRemaining: Math.max(0, maxLivenessAttempts - livenessAttempts),
          maxAttempts: maxLivenessAttempts
        }
      }
    });
  }
}

module.exports = { GetKycStatusUseCase };
