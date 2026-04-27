class NegotiationService {
  recommend({ requestedRent, averageRent, comparableCount, termMonths }) {
    const marketStrength = comparableCount >= 10 ? 0.97 : 0.94;
    const baseline = Math.min(Number(requestedRent), Number(averageRent) / marketStrength);
    const termDiscount = termMonths >= 18 ? 0.97 : 1;
    const suggestedRent = Math.round(baseline * termDiscount);

    return {
      suggestedRent,
      marketAverage: Number(averageRent),
      comparableCount,
      confidence: comparableCount >= 10 ? "high" : "medium"
    };
  }
}

module.exports = { NegotiationService };
