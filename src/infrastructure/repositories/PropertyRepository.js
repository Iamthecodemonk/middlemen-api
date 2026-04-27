const { PropertyListing } = require("../../domain/entities/PropertyListing");

class PropertyRepository {
  constructor(db) {
    this.db = db;
  }

  async create(property) {
    await this.db("properties").insert({
      id: property.id,
      owner_id: property.ownerId,
      title: property.title,
      description: property.description,
      property_type: property.propertyType,
      state: property.state,
      city: property.city,
      address: property.address,
      latitude: property.latitude,
      longitude: property.longitude,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      square_meters: property.squareMeters || null,
      monthly_rent: property.rentAmount.amount,
      security_deposit: property.securityDeposit.amount,
      is_available: property.isAvailable
    });
    return property;
  }

  async findById(id) {
    const row = await this.db("properties").where({ id }).first();
    if (!row) {
      return null;
    }

    return this.mapRow(row);
  }

  async findAll() {
    const rows = await this.db("properties").orderBy("created_at", "desc").limit(50);
    return rows.map((row) => this.mapRow(row));
  }

  async updateAvailability(id, isAvailable) {
    await this.db("properties").where({ id }).update({
      is_available: isAvailable,
      updated_at: this.db.fn.now()
    });
  }

  mapRow(row) {
    return new PropertyListing({
      id: row.id,
      ownerId: row.owner_id,
      title: row.title,
      description: row.description,
      propertyType: row.property_type,
      state: row.state,
      city: row.city,
      address: row.address,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      bedrooms: row.bedrooms,
      bathrooms: Number(row.bathrooms),
      squareMeters: row.square_meters,
      rentAmount: Number(row.monthly_rent),
      securityDeposit: Number(row.security_deposit),
      isAvailable: row.is_available
    });
  }
}

module.exports = { PropertyRepository };
