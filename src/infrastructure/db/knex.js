const knex = require("knex");
const path = require("path");
const { env } = require("../config/env");
const { SqlMigrationSource } = require("./SqlMigrationSource");

function createKnexClient() {
  const migrationsDirectory = path.join(__dirname, "migrations");

  return knex({
    client: "pg",
    connection: env.databaseUrl,
    migrations: {
      migrationSource: new SqlMigrationSource(migrationsDirectory)
    },
    pool: {
      min: 2,
      max: 10
    }
  });
}

module.exports = { createKnexClient };
