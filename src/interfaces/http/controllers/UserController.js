class UserController {
  static async updateAvatar(request, reply) {
    const payload = await request.server.container.useCases.auth.updateAvatar.execute({
      userId: request.auth.user.id,
      avatarUrl: request.body.avatarUrl
    });

    reply.send(payload);
  }
}

module.exports = { UserController };
