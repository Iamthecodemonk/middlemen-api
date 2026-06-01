class KycController {
  static async verifyNin(request, reply) {
    const payload = await request.server.container.useCases.verifyNin.execute({
      userId: request.auth.user.id,
      nin: request.body.nin
    });

    reply.send(payload);
  }

  static async verifyLiveness(request, reply) {
    const payload = await request.server.container.useCases.verifyLiveness.execute({
      userId: request.auth.user.id,
      selfieImageBase64: request.body.selfieImageBase64
    });

    reply.send(payload);
  }

  static async retryLiveness(request, reply) {
    return KycController.verifyLiveness(request, reply);
  }

  static async status(request, reply) {
    const payload = await request.server.container.useCases.getKycStatus.execute({
      userId: request.auth.user.id,
      maxLivenessAttempts: request.server.container.config.kycLivenessMaxAttempts
    });

    reply.send(payload);
  }
}

module.exports = { KycController };
