class NegotiationController {
  static async recommend(request, reply) {
    const recommendation = await request.server.container.useCases.recommendNegotiation.execute(
      request.body
    );

    reply.send(recommendation);
  }
}

module.exports = { NegotiationController };
