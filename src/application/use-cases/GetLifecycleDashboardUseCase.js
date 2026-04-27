class GetLifecycleDashboardUseCase {
  constructor({ dashboardRepository, cacheService }) {
    this.dashboardRepository = dashboardRepository;
    this.cacheService = cacheService;
  }

  async execute({ actorType, actorId }) {
    const cacheKey = `dashboard:${actorType}:${actorId}`;
    const cached = await this.cacheService.getJson(cacheKey);

    if (cached) {
      return {
        ...cached,
        source: "cache"
      };
    }

    const summary = await this.dashboardRepository.getSummary(actorType, actorId);
    await this.cacheService.setJson(cacheKey, summary, 120);

    return {
      ...summary,
      source: "fresh"
    };
  }
}

module.exports = { GetLifecycleDashboardUseCase };
