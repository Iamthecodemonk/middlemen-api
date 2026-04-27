const { createKnexClient } = require("./knex");

async function run() {
  const db = createKnexClient();
  const [batchNo, log] = await db.migrate.latest();
  console.log(`Migration batch ${batchNo} executed`, log);
  await db.destroy();
}

run().catch((error) => {
  console.error("Migration failed", error);
  process.exit(1);
});
