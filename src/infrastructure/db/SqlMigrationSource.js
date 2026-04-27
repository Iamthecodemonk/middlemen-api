const fs = require("fs");
const path = require("path");

class SqlMigrationSource {
  constructor(migrationsDirectory) {
    this.migrationsDirectory = migrationsDirectory;
  }

  getMigrations() {
    return fs
      .readdirSync(this.migrationsDirectory)
      .filter((file) => file.endsWith(".sql"))
      .sort();
  }

  getMigrationName(migration) {
    return migration;
  }

  getMigration(migration) {
    const fullPath = path.join(this.migrationsDirectory, migration);

    return {
      up: async (knex) => {
        const sql = fs.readFileSync(fullPath, "utf8");
        await knex.raw(sql);
      },
      down: async () => {
        throw new Error(`Down migration not implemented for SQL migration ${migration}`);
      }
    };
  }
}

module.exports = { SqlMigrationSource };
