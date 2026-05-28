const { createKnexClient } = require("./knex");

const maxAttempts = Number(process.env.MIGRATION_MAX_ATTEMPTS || 10);
const retryDelayMs = Number(process.env.MIGRATION_RETRY_DELAY_MS || 3000);

async function run() {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const db = createKnexClient();

    try {
      const [batchNo, log] = await db.migrate.latest();
      console.log(`Migration batch ${batchNo} executed`, log);
      await db.destroy();
      return;
    } catch (error) {
      await db.destroy();

      if (attempt === maxAttempts || !isRetryableStartupError(error)) {
        throw error;
      }

      console.warn(
        `Migration attempt ${attempt}/${maxAttempts} failed: ${error.message}. Retrying in ${retryDelayMs}ms...`
      );
      await delay(retryDelayMs);
    }
  }
}

run().catch((error) => {
  console.error("Migration failed", error);
  process.exit(1);
});

function isRetryableStartupError(error) {
  return ["EAI_AGAIN", "ECONNREFUSED", "57P03"].includes(error.code);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
