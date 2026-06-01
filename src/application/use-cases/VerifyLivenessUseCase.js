const { AppError } = require("../../shared/errors/AppError");
const { successResponse } = require("../../shared/utils/apiResponse");

class VerifyLivenessUseCase {
  constructor({
    userRepository,
    userVerificationRepository,
    dojahKycService,
    maxAttempts,
    threshold
  }) {
    this.userRepository = userRepository;
    this.userVerificationRepository = userVerificationRepository;
    this.dojahKycService = dojahKycService;
    this.maxAttempts = maxAttempts;
    this.threshold = threshold;
  }

  async execute({ userId, selfieImageBase64 }) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const attemptCount = await this.userVerificationRepository.countVerifications({
      userId,
      verificationType: "liveness"
    });

    if (attemptCount >= this.maxAttempts) {
      throw new AppError("Maximum liveness retry attempts reached", 429, {
        details: {
          maxAttempts: this.maxAttempts
        }
      });
    }

    const result = await this.dojahKycService.checkLiveness(selfieImageBase64);
    const liveness = result.liveness || {};
    const face = result.face || {};
    const probability = Number(liveness.liveness_probability || 0);
    const passed =
      liveness.liveness_check === true &&
      probability >= this.threshold &&
      face.face_detected === true &&
      face.multiface_detected !== true;

    const verification = await this.userVerificationRepository.recordLivenessVerification({
      userId,
      status: passed ? "verified" : "rejected",
      provider: "dojah",
      providerResponse: result,
      rejectedReason: passed ? null : buildFailureReason({ liveness, face, threshold: this.threshold })
    });

    let verifiedUser = user;
    if (passed) {
      const ninVerified = await this.userVerificationRepository.hasVerifiedType({
        userId,
        verificationType: "nin"
      });

      if (ninVerified) {
        verifiedUser = await this.userRepository.markIdentityVerified(userId);
      }
    }

    return successResponse({
      message: passed
        ? "Liveness check passed"
        : "Liveness check failed. Please retry with a clear live selfie.",
      data: {
        passed,
        attemptsMade: attemptCount + 1,
        attemptsRemaining: Math.max(0, this.maxAttempts - attemptCount - 1),
        user: sanitizeUser(verifiedUser),
        verification: {
          id: verification.id,
          status: verification.status,
          verificationType: verification.verificationType,
          verifiedAt: verification.verifiedAt,
          rejectedReason: verification.rejectedReason
        },
        liveness: {
          livenessCheck: liveness.liveness_check === true,
          livenessProbability: probability,
          threshold: this.threshold,
          faceDetected: face.face_detected === true,
          multiFaceDetected: face.multiface_detected === true
        }
      }
    });
  }
}

function buildFailureReason({ liveness, face, threshold }) {
  if (face.face_detected !== true) {
    return "No face detected";
  }

  if (face.multiface_detected === true) {
    return "Multiple faces detected";
  }

  if (Number(liveness.liveness_probability || 0) < threshold) {
    return "Liveness probability is below threshold";
  }

  return "Liveness check failed";
}

function sanitizeUser(user) {
  const { passwordHash, googleId, ...safeUser } = user;
  return safeUser;
}

module.exports = { VerifyLivenessUseCase };
