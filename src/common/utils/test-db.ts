import type { CustomDatabase } from "#src/database/mod.ts";

export const runMigrations = async (db: CustomDatabase) => {
  const migrationsPathRelative = "../../database/migrations";
  const migartionsDir = new URL(migrationsPathRelative, import.meta.url);
  let [{ foreign_keys: foreingKeysVal }] = db.sql`pragma foreign_keys`;
  foreingKeysVal = foreingKeysVal === 1 ? "ON" : "OFF";

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
