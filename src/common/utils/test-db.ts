import type { CustomDatabase } from "#src/database/mod.ts";

export const runMigrations = async (db: CustomDatabase) => {
  const migrationsPathRelative = "../../database/migrations";
  const migartionsDir = new URL(migrationsPathRelative, import.meta.url);
  const [row] = db.sql<{ foreign_keys: number }>`pragma foreign_keys`;

  if (!row) throw new Error("Could not get current foreign keys status");

  const foreingKeysVal = row.foreign_keys === 1 ? "ON" : "OFF";

  db.exec("pragma foreign_keys = off");

  const migrationFiles = (await Array.fromAsync(Deno.readDir(migartionsDir)))
    .filter((item) => item.isFile && item.name.endsWith(".sql")).map((item) =>
      item.name
    ).sort();

  for (const file of migrationFiles) {
    const filePath = new URL(
      `${migrationsPathRelative}/${file}`,
      import.meta.url,
    );

    db.exec(await Deno.readTextFile(filePath));
  }

  db.exec(`pragma foreign_keys = ${foreingKeysVal}`);
};
