import mongoose from "mongoose";
import { Migration } from "../models/migration-model.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadMigrations() {
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".js") && f !== "runner.js");

  const migrations = [];
  for (const file of files) {
    const migrationModule = await import(pathToFileURL(path.join(migrationsDir, file)).href);
    migrations.push({
      file,
      version: migrationModule.version,
      name: migrationModule.name,
      up: migrationModule.up,
      down: migrationModule.down,
    });
  }

  migrations.sort((a, b) => a.version.localeCompare(b.version));
  return migrations;
}

async function getAppliedMigrations() {
  return await Migration.find({ status: "completed" }).sort({ version: 1 }).lean();
}

export async function runMigrations() {
  console.log("[Migrations] Starting migration process...");

  const migrations = await loadMigrations();
  const applied = await getAppliedMigrations();
  const appliedVersions = new Set(applied.map(m => m.version));

  const pendingMigrations = migrations.filter(m => !appliedVersions.has(m.version));

  if (pendingMigrations.length === 0) {
    console.log("[Migrations] No pending migrations. Database is up to date.");
    return;
  }

  console.log(`[Migrations] Found ${pendingMigrations.length} pending migration(s)`);

  for (const migration of pendingMigrations) {
    const startTime = Date.now();
    console.log(`[Migrations] Applying ${migration.version} - ${migration.name}...`);

    let migrationRecord = await Migration.create({
      version: migration.version,
      name: migration.name,
      status: "running",
    });

    try {
      await migration.up(mongoose.connection);

      await Migration.findByIdAndUpdate(migrationRecord._id, {
        status: "completed",
        appliedAt: new Date(),
        duration: Date.now() - startTime,
      });

      console.log(`[Migrations] Successfully applied ${migration.version} (${Date.now() - startTime}ms)`);
    } catch (err) {
      await Migration.findByIdAndUpdate(migrationRecord._id, {
        status: "failed",
        error: err.message,
        duration: Date.now() - startTime,
      });

      console.error(`[Migrations] Failed to apply ${migration.version}:`, err.message);
      throw err;
    }
  }

  console.log("[Migrations] All migrations completed successfully");
}

export async function rollbackMigration(targetVersion = null) {
  console.log("[Migrations] Starting rollback process...");

  const applied = await getAppliedMigrations();

  if (applied.length === 0) {
    console.log("[Migrations] No migrations to rollback.");
    return;
  }

  const migrations = await loadMigrations();
  const migrationsMap = new Map(migrations.map(m => [m.version, m]));

    let toRollback = [...applied].reverse();

  if (targetVersion) {
    toRollback = toRollback.filter(m => m.version > targetVersion);
  } else {
    toRollback = [toRollback[0]];
  }

  if (toRollback.length === 0) {
    console.log("[Migrations] No migrations to rollback.");
    return;
  }

  for (const migrationRecord of toRollback) {
    const migration = migrationsMap.get(migrationRecord.version);

    if (!migration) {
      throw new Error(`Migration ${migrationRecord.version} not found in migration files`);
    }

    if (!migration.down) {
      throw new Error(`Migration ${migrationRecord.version} does not have a down method`);
    }

    const startTime = Date.now();
    console.log(`[Migrations] Rolling back ${migrationRecord.version} - ${migrationRecord.name}...`);

    try {
      await migration.down(mongoose.connection);

      await Migration.findByIdAndUpdate(migrationRecord._id, {
        status: "rolled_back",
        rolledBackAt: new Date(),
        duration: Date.now() - startTime,
      });

      console.log(`[Migrations] Successfully rolled back ${migrationRecord.version} (${Date.now() - startTime}ms)`);
    } catch (err) {
      console.error(`[Migrations] Failed to rollback ${migrationRecord.version}:`, err.message);
      throw err;
    }
  }

  console.log("[Migrations] Rollback completed successfully");
}

export async function getMigrationStatus() {
  const migrations = await loadMigrations();
  const applied = await Migration.find().sort({ version: 1, createdAt: -1 }).lean();
  const appliedMap = new Map();

  for (const m of applied) {
    if (!appliedMap.has(m.version)) {
      appliedMap.set(m.version, m);
    }
  }

  return migrations.map(m => ({
    version: m.version,
    name: m.name,
    status: appliedMap.has(m.version) ? appliedMap.get(m.version).status : "pending",
    appliedAt: appliedMap.has(m.version) ? appliedMap.get(m.version).appliedAt : null,
  }));
}
