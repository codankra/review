import * as SQLite from "expo-sqlite";
import { DailyEntry, DailyEntryRow, ScoresMap, Note } from "./types";

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
      scores      TEXT DEFAULT '{}',
      is_archived INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS notes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      text        TEXT NOT NULL,
      created_at  TEXT DEFAULT (datetime('now'))
    );
  `);
  await ensureTodayRow(db);
}

export async function ensureTodayRow(db: SQLite.SQLiteDatabase): Promise<void> {
  const today = getTodayDateString();
  await db.runAsync(
    `INSERT OR IGNORE INTO daily_entries (date, scores, is_archived) VALUES (?, '{}', 0)`,
    [today],
  );
}

export async function getActiveEntries(
  db: SQLite.SQLiteDatabase,
): Promise<DailyEntry[]> {
  const rows = await db.getAllAsync<DailyEntryRow>(
    `SELECT * FROM daily_entries WHERE is_archived = 0 ORDER BY date ASC`,
  );
  return rows.map(rowToEntry);
}

export function generateDateRange(
  startDate: string,
  endDate: string,
): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export async function updateNotes(
  db: SQLite.SQLiteDatabase,
  date: string,
  notes: string,
): Promise<void> {
  await db.runAsync(`UPDATE daily_entries SET notes = ? WHERE date = ?`, [
    notes,
    date,
  ]);
}

export async function updateScore(
  db: SQLite.SQLiteDatabase,
  date: string,
  metricId: string,
  value: number,
): Promise<void> {
  // Read current scores, patch, write back
  const row = await db.getFirstAsync<{ scores: string }>(
    `SELECT scores FROM daily_entries WHERE date = ?`,
    [date],
  );
  let scores: ScoresMap = {};
  try {
    scores = JSON.parse(row?.scores ?? "{}");
  } catch {}
  scores[metricId] = value as 0 | 0.5 | 1.0;

  // Use INSERT OR REPLACE to handle missing rows
  await db.runAsync(
    `INSERT OR REPLACE INTO daily_entries (date, scores, is_archived) VALUES (?, ?, 0)`,
    [date, JSON.stringify(scores)],
  );
}

export async function archiveAllActive(
  db: SQLite.SQLiteDatabase,
): Promise<void> {
  await db.runAsync(
    `UPDATE daily_entries SET is_archived = 1 WHERE is_archived = 0`,
  );
}

export async function getAllActiveRaw(
  db: SQLite.SQLiteDatabase,
): Promise<DailyEntry[]> {
  return getActiveEntries(db);
}

export async function getAllNotes(db: SQLite.SQLiteDatabase): Promise<Note[]> {
  const rows = await db.getAllAsync<Note>(
    `SELECT id, text, created_at FROM notes ORDER BY created_at DESC`,
  );
  return rows;
}

export async function addNote(
  db: SQLite.SQLiteDatabase,
  text: string,
): Promise<Note> {
  const result = await db.runAsync(`INSERT INTO notes (text) VALUES (?)`, [
    text,
  ]);
  const rows = await db.getAllAsync<Note>(
    `SELECT id, text, created_at FROM notes WHERE id = ?`,
    [result.lastInsertRowId],
  );
  return rows[0];
}

export async function updateNote(
  db: SQLite.SQLiteDatabase,
  id: number,
  text: string,
): Promise<void> {
  await db.runAsync(`UPDATE notes SET text = ? WHERE id = ?`, [text, id]);
}

export async function deleteNote(
  db: SQLite.SQLiteDatabase,
  id: number,
): Promise<void> {
  await db.runAsync(`DELETE FROM notes WHERE id = ?`, [id]);
}
