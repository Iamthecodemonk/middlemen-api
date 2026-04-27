class RecommendNegotiationUseCase {
  constructor({ negotiationReadRepository, negotiationService, cacheService }) {
    this.negotiationReadRepository = negotiationReadRepository;
    this.negotiationService = negotiationService;
    this.cacheService = cacheService;
  }

  async execute(input) {
    const cacheKey = `negotiation:${input.state}:${input.city}:${input.propertyType}:${input.bedrooms}:${input.requestedRent}:${input.termMonths}`;
    const cached = await this.cacheService.getJson(cacheKey);

    if (cached) {
      return {
        ...cached,
        source: "cache"
      };
    }

    const snapshot = await this.negotiationReadRepository.findComparableMarketData(input);

    const recommendation = this.negotiationService.recommend({
      requestedRent: input.requestedRent,
      averageRent: snapshot?.averageRent || input.requestedRent,
      comparableCount: snapshot?.comparableCount || 0,
      termMonths: input.termMonths
    });

    await this.cacheService.setJson(cacheKey, recommendation, 600);

    return {
      ...recommendation,
      source: "fresh"
    };
  }
}

module.exports = { RecommendNegotiationUseCase };
