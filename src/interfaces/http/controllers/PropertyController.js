class PropertyController {
  static async create(request, reply) {
    const property = await request.server.container.useCases.createPropertyListing.execute({
      ...request.body,
      ownerId: request.body.ownerId || request.auth?.user?.id
    });

    reply.code(201).send(property);
  }

  static async list(request, reply) {
    const properties = await request.server.container.db("properties")
      .select("*")
      .orderBy("created_at", "desc")
      .limit(50);

    reply.send({ data: properties });
  }
}

module.exports = { PropertyController };
