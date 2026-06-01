const { createKnexClient } = require("../db/knex");
const { createRedisClient } = require("../cache/redis");
const { PropertyRepository } = require("../repositories/PropertyRepository");
const { ClaimRepository } = require("../repositories/ClaimRepository");
const { NegotiationReadRepository } = require("../repositories/NegotiationReadRepository");
const { DashboardRepository } = require("../repositories/DashboardRepository");
const {
  UserVerificationRepository
} = require("../repositories/UserVerificationRepository");
const { CacheService } = require("../services/CacheService");
const { UserRepository } = require("../repositories/auth/UserRepository");
const {
  PendingRegistrationRepository
} = require("../repositories/auth/PendingRegistrationRepository");
const { RefreshTokenRepository } = require("../repositories/auth/RefreshTokenRepository");
const { PasswordResetTokenRepository } = require("../repositories/auth/PasswordResetTokenRepository");
const { CreatePropertyListingUseCase } = require("../../application/use-cases/CreatePropertyListingUseCase");
const { ClaimPropertyUseCase } = require("../../application/use-cases/ClaimPropertyUseCase");
const { RecommendNegotiationUseCase } = require("../../application/use-cases/RecommendNegotiationUseCase");
const { GetLifecycleDashboardUseCase } = require("../../application/use-cases/GetLifecycleDashboardUseCase");
const { VerifyNinUseCase } = require("../../application/use-cases/VerifyNinUseCase");
const { VerifyLivenessUseCase } = require("../../application/use-cases/VerifyLivenessUseCase");
const { GetKycStatusUseCase } = require("../../application/use-cases/GetKycStatusUseCase");
const { CheckAvailabilityUseCase } = require("../../application/use-cases/auth/CheckAvailabilityUseCase");
const { RegisterUserUseCase } = require("../../application/use-cases/auth/RegisterUserUseCase");
const { VerifyOtpUseCase } = require("../../application/use-cases/auth/VerifyOtpUseCase");
const { ResendOtpUseCase } = require("../../application/use-cases/auth/ResendOtpUseCase");
const { LoginUserUseCase } = require("../../application/use-cases/auth/LoginUserUseCase");
const { RefreshSessionUseCase } = require("../../application/use-cases/auth/RefreshSessionUseCase");
const { ForgotPasswordUseCase } = require("../../application/use-cases/auth/ForgotPasswordUseCase");
const { ResetPasswordUseCase } = require("../../application/use-cases/auth/ResetPasswordUseCase");
const { GoogleAuthUseCase } = require("../../application/use-cases/auth/GoogleAuthUseCase");
const { UpdateAvatarUseCase } = require("../../application/use-cases/auth/UpdateAvatarUseCase");
const { NegotiationService } = require("../../domain/services/NegotiationService");
const { PasswordHasher } = require("../services/auth/PasswordHasher");
const { JwtService } = require("../services/auth/JwtService");
const { OtpService } = require("../services/auth/OtpService");
const { TermiiOtpService } = require("../services/auth/TermiiOtpService");
const { AuthRateLimiter } = require("../services/auth/AuthRateLimiter");
const { AuthDeliveryService } = require("../services/auth/AuthDeliveryService");
const { GoogleAuthService } = require("../services/auth/GoogleAuthService");
const { SmtpEmailService } = require("../services/notifications/SmtpEmailService");
const { TermiiSmsService } = require("../services/notifications/TermiiSmsService");
const { DojahKycService } = require("../services/kyc/DojahKycService");
const ImageQueue = require("../queue/imageQueue").createImageQueue();
const { env } = require("./env");

async function createContainer() {
  const db = createKnexClient();
  const redis = createRedisClient();

  await redis.connect();

  const propertyRepository = new PropertyRepository(db);
  const claimRepository = new ClaimRepository(db);
  const negotiationReadRepository = new NegotiationReadRepository(db);
  const dashboardRepository = new DashboardRepository(db);
  const userRepository = new UserRepository(db);
  const userVerificationRepository = new UserVerificationRepository(db);
  const pendingRegistrationRepository = new PendingRegistrationRepository(db);
  const refreshTokenRepository = new RefreshTokenRepository(db);
  const passwordResetTokenRepository = new PasswordResetTokenRepository(db);
  const negotiationService = new NegotiationService();
  const cacheService = new CacheService(redis);
  const passwordHasher = new PasswordHasher();
  const jwtService = new JwtService({
    accessSecret: env.jwtAccessSecret,
    refreshSecret: env.jwtRefreshSecret,
    accessExpiresIn: env.jwtAccessExpiresIn,
    refreshExpiresIn: env.jwtRefreshExpiresIn
  });
  const termiiOtpService = new TermiiOtpService({
    apiKey: env.termiiApiKey,
    baseUrl: env.termiiBaseUrl,
    senderId: env.termiiSenderId,
    channel: env.termiiChannel,
    pinAttempts: env.termiiPinAttempts,
    pinLength: env.termiiPinLength,
    ttlSeconds: env.otpTtlSeconds
  });
  const otpService = new OtpService(redis, {
    ttlSeconds: env.otpTtlSeconds,
    resendCooldownSeconds: env.otpResendCooldownSeconds,
    termiiOtpService
  });
  const authRateLimiter = new AuthRateLimiter(redis, {
    maxAttempts: env.loginRateLimitMax,
    windowSeconds: env.loginRateLimitWindowSeconds
  });
  const emailService = new SmtpEmailService({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    user: env.smtpUser,
    pass: env.smtpPass,
    fromName: env.smtpFromName,
    fromAddress: env.smtpFromAddress,
    connectionTimeoutMs: env.smtpConnectionTimeoutMs,
    greetingTimeoutMs: env.smtpGreetingTimeoutMs
  });
  const smsService = new TermiiSmsService({
    apiKey: env.termiiApiKey,
    baseUrl: env.termiiBaseUrl,
    senderId: env.termiiSenderId,
    channel: env.termiiChannel
  });
  const authDeliveryService = new AuthDeliveryService({
    emailService,
    smsService
  });
  const googleAuthService = new GoogleAuthService({ clientId: env.googleClientId });
  const dojahKycService = new DojahKycService({
    baseUrl: env.dojahBaseUrl,
    appId: env.dojahAppId,
    secretKey: env.dojahSecretKey
  });

  return {
    db,
    redis,
    jwtService,
    config: {
      kycLivenessMaxAttempts: env.kycLivenessMaxAttempts
    },
    queues: {
      imageQueue: ImageQueue
    },
    repositories: {
      userRepository
    },
    useCases: {
      createPropertyListing: new CreatePropertyListingUseCase({ propertyRepository }),
      claimProperty: new ClaimPropertyUseCase({ propertyRepository, claimRepository }),
      recommendNegotiation: new RecommendNegotiationUseCase({
        negotiationReadRepository,
        negotiationService,
        cacheService
      }),
      getLifecycleDashboard: new GetLifecycleDashboardUseCase({
        dashboardRepository,
        cacheService
      }),
      verifyNin: new VerifyNinUseCase({
        userRepository,
        userVerificationRepository,
        dojahKycService
      }),
      verifyLiveness: new VerifyLivenessUseCase({
        userRepository,
        userVerificationRepository,
        dojahKycService,
        maxAttempts: env.kycLivenessMaxAttempts,
        threshold: env.kycLivenessThreshold
      }),
      getKycStatus: new GetKycStatusUseCase({
        userVerificationRepository
      }),
      auth: {
        checkAvailability: new CheckAvailabilityUseCase({ userRepository }),
        register: new RegisterUserUseCase({
          userRepository,
          pendingRegistrationRepository,
          passwordHasher,
          otpService,
          authDeliveryService,
          otpTtlSeconds: env.otpTtlSeconds
        }),
        verifyOtp: new VerifyOtpUseCase({
          db,
          userRepository,
          pendingRegistrationRepository,
          otpService,
          jwtService,
          refreshTokenRepository
        }),
        resendOtp: new ResendOtpUseCase({
          userRepository,
          pendingRegistrationRepository,
          otpService,
          authDeliveryService
        }),
        login: new LoginUserUseCase({
          userRepository,
          passwordHasher,
          jwtService,
          refreshTokenRepository,
          authRateLimiter
        }),
        googleAuth: new GoogleAuthUseCase({
          userRepository,
          googleAuthService,
          jwtService,
          refreshTokenRepository
        }),
        refreshSession: new RefreshSessionUseCase({
          userRepository,
          jwtService,
          refreshTokenRepository
        }),
        forgotPassword: new ForgotPasswordUseCase({
          userRepository,
          passwordResetTokenRepository,
          authDeliveryService
        }),
        resetPassword: new ResetPasswordUseCase({
          passwordResetTokenRepository,
          userRepository,
          passwordHasher,
          refreshTokenRepository
        })
        ,
        updateAvatar: new UpdateAvatarUseCase({ userRepository })
      }
    }
  };
}

module.exports = { createContainer };
