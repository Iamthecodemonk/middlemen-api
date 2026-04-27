const { AppError } = require("../../../shared/errors/AppError");

class DashboardController {
  static async summary(request, reply) {
    if (request.auth.user.role !== "admin" && request.params.actorId !== request.auth.user.id) {
      throw new AppError("You can only view your own dashboard", 403);
    }

    const summary = await request.server.container.useCases.getLifecycleDashboard.execute({
      actorType: request.params.actorType,
      actorId: request.params.actorId
    });

    reply.send(summary);
  }
}

module.exports = { DashboardController };
