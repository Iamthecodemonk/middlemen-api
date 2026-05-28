const { getRequestMetadata } = require("../../../../shared/utils/getRequestMetadata");

class AuthController {
  static async checkAvailability(request, reply) {
    const payload = await request.server.container.useCases.auth.checkAvailability.execute(
      request.body
    );
    reply.send(payload);
  }

  static async register(request, reply) {
    const payload = await request.server.container.useCases.auth.register.execute(request.body);
    reply.code(201).send(payload);
  }

  static async verifyOtp(request, reply) {
    const payload = await request.server.container.useCases.auth.verifyOtp.execute({
      ...request.body,
      ...getRequestMetadata(request)
    });
    reply.send(payload);
  }

  static async resendOtp(request, reply) {
    const payload = await request.server.container.useCases.auth.resendOtp.execute(request.body);
    reply.send(payload);
  }

  static async login(request, reply) {
    const payload = await request.server.container.useCases.auth.login.execute({
      ...request.body,
      ...getRequestMetadata(request)
    });
    reply.send(payload);
  }

  static async google(request, reply) {
    const payload = await request.server.container.useCases.auth.googleAuth.execute({
      ...request.body,
      ...getRequestMetadata(request)
    });
    reply.send(payload);
  }

  static async refresh(request, reply) {
    const payload = await request.server.container.useCases.auth.refreshSession.execute({
      ...request.body,
      ...getRequestMetadata(request)
    });
    reply.send(payload);
  }

  static async forgotPassword(request, reply) {
    const payload = await request.server.container.useCases.auth.forgotPassword.execute(
      request.body
    );
    reply.send(payload);
  }

  static async resetPassword(request, reply) {
    const payload = await request.server.container.useCases.auth.resetPassword.execute(
      request.body
    );
    reply.send(payload);
  }
}

module.exports = { AuthController };
