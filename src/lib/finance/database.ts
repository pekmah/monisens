import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

import { MONISENS_DB_NAME } from "@/lib/finance/constants";
import * as schema from "@/lib/finance/schema";

const sqlite = openDatabaseSync(MONISENS_DB_NAME);
sqlite.execSync("PRAGMA foreign_keys = ON;");
sqlite.execSync("PRAGMA journal_mode = WAL;");

export const financeDatabase = drizzle(sqlite, { schema });
export const sqliteDatabase = sqlite;
