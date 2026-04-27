class ClaimController {
  static async create(request, reply) {
    const claim = await request.server.container.useCases.claimProperty.execute({
      ...request.body,
      tenantId: request.body.tenantId || request.auth?.user?.id
    });

    reply.code(201).send(claim);
  }
}

module.exports = { ClaimController };
