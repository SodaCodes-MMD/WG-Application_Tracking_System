import dotenv from "dotenv";
dotenv.config();

import { connectDB, disconnectDB } from "../db/connection.js";
import { rollbackMigration, getMigrationStatus } from "../db/migrations/runner.js";

async function main() {
  try {
    const targetVersion = process.argv[2] || null;

    await connectDB();
    await rollbackMigration(targetVersion);

    const status = await getMigrationStatus();
    console.log("\n[Migration Status]");
    for (const m of status) {
      const statusIcon = m.status === "completed" ? "✓" : m.status === "rolled_back" ? "↺" : "○";
      console.log(`  ${statusIcon} ${m.version} - ${m.name} (${m.status})`);
    }

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error("[Migration] Rollback failed:", err.message);
    process.exit(1);
  }
}

main();
