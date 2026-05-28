const { createKnexClient } = require("../db/knex");
const { createRedisClient } = require("../cache/redis");
const { PropertyRepository } = require("../repositories/PropertyRepository");
const { ClaimRepository } = require("../repositories/ClaimRepository");
const { NegotiationReadRepository } = require("../repositories/NegotiationReadRepository");
const { DashboardRepository } = require("../repositories/DashboardRepository");
const { CacheService } = require("../services/CacheService");
const { UserRepository } = require("../repositories/auth/UserRepository");
const { RefreshTokenRepository } = require("../repositories/auth/RefreshTokenRepository");
const { PasswordResetTokenRepository } = require("../repositories/auth/PasswordResetTokenRepository");
const { CreatePropertyListingUseCase } = require("../../application/use-cases/CreatePropertyListingUseCase");
const { ClaimPropertyUseCase } = require("../../application/use-cases/ClaimPropertyUseCase");
const { RecommendNegotiationUseCase } = require("../../application/use-cases/RecommendNegotiationUseCase");
const { GetLifecycleDashboardUseCase } = require("../../application/use-cases/GetLifecycleDashboardUseCase");
const { CheckAvailabilityUseCase } = require("../../application/use-cases/auth/CheckAvailabilityUseCase");
const { RegisterUserUseCase } = require("../../application/use-cases/auth/RegisterUserUseCase");
const { VerifyOtpUseCase } = require("../../application/use-cases/auth/VerifyOtpUseCase");
const { ResendOtpUseCase } = require("../../application/use-cases/auth/ResendOtpUseCase");
const { LoginUserUseCase } = require("../../application/use-cases/auth/LoginUserUseCase");
const { RefreshSessionUseCase } = require("../../application/use-cases/auth/RefreshSessionUseCase");
const { ForgotPasswordUseCase } = require("../../application/use-cases/auth/ForgotPasswordUseCase");
const { ResetPasswordUseCase } = require("../../application/use-cases/auth/ResetPasswordUseCase");
const { GoogleAuthUseCase } = require("../../application/use-cases/auth/GoogleAuthUseCase");
const { NegotiationService } = require("../../domain/services/NegotiationService");
const { PasswordHasher } = require("../services/auth/PasswordHasher");
const { JwtService } = require("../services/auth/JwtService");
const { OtpService } = require("../services/auth/OtpService");
const { AuthRateLimiter } = require("../services/auth/AuthRateLimiter");
const { AuthDeliveryService } = require("../services/auth/AuthDeliveryService");
const { GoogleAuthService } = require("../services/auth/GoogleAuthService");
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
  const otpService = new OtpService(redis, {
    ttlSeconds: env.otpTtlSeconds,
    resendCooldownSeconds: env.otpResendCooldownSeconds
  });
  const authRateLimiter = new AuthRateLimiter(redis, {
    maxAttempts: env.loginRateLimitMax,
    windowSeconds: env.loginRateLimitWindowSeconds
  });
  const authDeliveryService = new AuthDeliveryService();
  const googleAuthService = new GoogleAuthService({ clientId: env.googleClientId });

  return {
    db,
    redis,
    jwtService,
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
      auth: {
        checkAvailability: new CheckAvailabilityUseCase({ userRepository }),
        register: new RegisterUserUseCase({
          userRepository,
          passwordHasher,
          otpService,
          authDeliveryService
        }),
        verifyOtp: new VerifyOtpUseCase({
          userRepository,
          otpService,
          jwtService,
          refreshTokenRepository
        }),
        resendOtp: new ResendOtpUseCase({
          userRepository,
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
      }
    }
  };
}

module.exports = { createContainer };
