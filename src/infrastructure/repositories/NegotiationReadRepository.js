class NegotiationReadRepository {
  constructor(db) {
    this.db = db;
  }

  async findComparableMarketData({ state, city, propertyType, bedrooms }) {
    const row = await this.db("negotiation_snapshots")
      .select("average_rent", "comparable_count")
      .where({
        state,
        city,
        property_type: propertyType,
        bedrooms
      })
      .orderBy("created_at", "desc")
      .first();

    if (!row) {
      return null;
    }

    return {
      averageRent: Number(row.average_rent),
      comparableCount: row.comparable_count
    };
  }
}

module.exports = { NegotiationReadRepository };
