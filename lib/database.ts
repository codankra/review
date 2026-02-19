import * as SQLite from "expo-sqlite";
import { DailyEntry, DailyEntryRow, ScoresMap } from "./types";

export const DATABASE_NAME = "theme_tracker.db";

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function rowToEntry(row: DailyEntryRow): DailyEntry {
  let scores: ScoresMap = {};
  try {
    scores = JSON.parse(row.scores);
  } catch {}
  return {
    date: row.date,
    notes: row.notes ?? "",
    scores,
    is_archived: row.is_archived as 0 | 1,
  };
}

/** Run once at startup — creates table if needed and seeds today's row. */
export async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS daily_entries (
      date        TEXT PRIMARY KEY,
      notes       TEXT DEFAULT '',
      scores      TEXT DEFAULT '{}',
      is_archived INTEGER DEFAULT 0
    );
  `);
  await ensureTodayRow(db);
}

export async function ensureTodayRow(db: SQLite.SQLiteDatabase): Promise<void> {
  const today = getTodayDateString();
  await db.runAsync(
    `INSERT OR IGNORE INTO daily_entries (date, notes, scores, is_archived) VALUES (?, '', '{}', 0)`,
    [today]
  );
}

export async function getActiveEntries(db: SQLite.SQLiteDatabase): Promise<DailyEntry[]> {
  const rows = await db.getAllAsync<DailyEntryRow>(
    `SELECT * FROM daily_entries WHERE is_archived = 0 ORDER BY date ASC`
  );
  return rows.map(rowToEntry);
}

export async function updateNotes(
  db: SQLite.SQLiteDatabase,
  date: string,
  notes: string
): Promise<void> {
  await db.runAsync(`UPDATE daily_entries SET notes = ? WHERE date = ?`, [notes, date]);
}

export async function updateScore(
  db: SQLite.SQLiteDatabase,
  date: string,
  metricId: string,
  value: number
): Promise<void> {
  // Read current scores, patch, write back
  const row = await db.getFirstAsync<{ scores: string }>(
    `SELECT scores FROM daily_entries WHERE date = ?`,
    [date]
  );
  let scores: ScoresMap = {};
  try {
    scores = JSON.parse(row?.scores ?? "{}");
  } catch {}
  scores[metricId] = value as 0 | 0.5 | 1.0;
  await db.runAsync(`UPDATE daily_entries SET scores = ? WHERE date = ?`, [
    JSON.stringify(scores),
    date,
  ]);
}

export async function archiveAllActive(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.runAsync(`UPDATE daily_entries SET is_archived = 1 WHERE is_archived = 0`);
}

export async function getAllActiveRaw(db: SQLite.SQLiteDatabase): Promise<DailyEntry[]> {
  return getActiveEntries(db);
}
