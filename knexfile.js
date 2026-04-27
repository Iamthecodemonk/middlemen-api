const path = require("path");
require("dotenv").config();
const { SqlMigrationSource } = require("./src/infrastructure/db/SqlMigrationSource");

const migrationsDirectory = path.join(__dirname, "src", "infrastructure", "db", "migrations");

module.exports = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    migrations: {
      migrationSource: new SqlMigrationSource(migrationsDirectory)
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};
