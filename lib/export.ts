import {
  AppSettings,
  CategoryConfig,
  DailyEntry,
  Note,
  ScoreValue,
} from "./types";

export interface ExportPayload {
  task_id: string;
  content: string;
}

// ─── Score helpers ────────────────────────────────────────────────────────────

/** Map a raw score (or undefined/missing) to a filled/half/empty circle. */
function scoreToCircle(score: ScoreValue | undefined): string {
  if (score === 1) return "●";
  if (score === 0.5) return "◐";
  return "○";
}

/**
 * Get the score for a metric on a given entry.
 * Treats a missing key as 0 (Plan A: unset == did not do it).
 */
function getScore(entry: DailyEntry, metricId: string): ScoreValue {
  const v = entry.scores[metricId];
  return v !== undefined ? v : 0;
}

// ─── Average calculations ─────────────────────────────────────────────────────

/** Average score (0–1) for a single metric across all entries. */
export function calcMetricAverage(
  entries: DailyEntry[],
  metricId: string,
): number {
  if (entries.length === 0) return 0;
  const sum = entries.reduce((acc, e) => acc + getScore(e, metricId), 0);
  return sum / entries.length;
}

/**
 * Weighted average score (0–1) for a whole category across all entries.
 * Each metric's contribution is proportional to its `weight` field.
 */
export function calcCategoryAverage(
  entries: DailyEntry[],
  category: CategoryConfig,
): number {
  if (entries.length === 0 || category.metrics.length === 0) return 0;
  const totalWeight = category.metrics.reduce((s, m) => s + (m.weight ?? 1), 0);
  if (totalWeight === 0) return 0;
  const weightedSum = category.metrics.reduce(
    (s, m) => s + calcMetricAverage(entries, m.id) * (m.weight ?? 1),
    0,
  );
  return weightedSum / totalWeight;
}

/** Format a 0–1 average as a percentage string, e.g. "73%". */
function fmtPct(avg: number): string {
  return `${Math.round(avg * 100)}%`;
}

// ─── Date formatting ──────────────────────────────────────────────────────────

/**
 * Convert "YYYY-MM-DD" → short header like "Mon 9".
 * Uses local midnight to avoid UTC-shift surprises.
 */
function fmtDateHeader(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const date = new Date(y, mo - 1, d);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${dayNames[date.getDay()]} ${d}`;
}

// ─── Markdown table builder ───────────────────────────────────────────────────

/**
 * Build the main history table:
 *
 * | Metric          | Mon 9 | Tue 10 | … | Avg  |
 * | --------------- | ----- | ------ | - | ---- |
 * | MENTAL HEALTH   |       |        |   |      |
 * | Spoke to Friend | ◐     | ○      | … | 60%  |
 * | …               |       |        |   |      |
 */
function buildHistoryTable(
  entries: DailyEntry[],
  config: CategoryConfig[],
): string {
  if (entries.length === 0) return "_No entries to display._";

  // ── Column headers ──
  const dateHeaders = entries.map((e) => fmtDateHeader(e.date));
  const headerRow = `| Metric | ${dateHeaders.join(" | ")} | Avg |`;
  const separator = `| :--- | ${entries.map(() => ":---:").join(" | ")} | ---: |`;

  // ── Data rows ──
  const dataRows: string[] = [];

  for (const cat of config) {
    // Category sub-header row (bold label, all other cells blank)
    const blankCells = entries.map(() => "").join(" | ");
    dataRows.push(`| **${cat.category.toUpperCase()}** | ${blankCells} | |`);

    for (const metric of cat.metrics) {
      const circles = entries
        .map((e) => scoreToCircle(getScore(e, metric.id)))
        .join(" | ");
      const avg = fmtPct(calcMetricAverage(entries, metric.id));
      dataRows.push(`| ${metric.label} | ${circles} | ${avg} |`);
    }
  }

  return [headerRow, separator, ...dataRows].join("\n");
}

// ─── Score summary section ────────────────────────────────────────────────────

function buildScoreSummary(
  entries: DailyEntry[],
  config: CategoryConfig[],
): string {
  const lines: string[] = [];

  for (const cat of config) {
    const catAvg = fmtPct(calcCategoryAverage(entries, cat));
    lines.push(`\n**${cat.category}** — ${catAvg}`);

    for (const metric of cat.metrics) {
      const metricAvg = fmtPct(calcMetricAverage(entries, metric.id));
      lines.push(`  - ${metric.label}: ${metricAvg}`);
    }
  }

  return lines.join("\n");
}

// ─── Main markdown builder ────────────────────────────────────────────────────

export function createReflectionMarkdown(
  entries: DailyEntry[],
  notes: Note[],
  config: CategoryConfig[],
  periodEndDate: string,
): string {
  const notesList =
    notes.length > 0
      ? notes.map((n) => `- ${n.text}`).join("\n")
      : "_No notes recorded._";

  const markdown = `# Weekly Review — ${periodEndDate}

## Scores
${buildScoreSummary(entries, config)}


## Reflections
### What are you feeling good about?

### Any ideas for improvement?

### Anything to add to tasks?

${notesList}

## Daily History

${buildHistoryTable(entries, config)}

`;

  console.log(markdown);
  return markdown;
}

// ─── Payload builder ──────────────────────────────────────────────────────────

export function buildExportPayload(
  entries: DailyEntry[],
  notes: Note[],
  settings: AppSettings,
  periodEndDate: string,
): ExportPayload {
  return {
    task_id: settings.todoistTaskId,
    content: createReflectionMarkdown(
      entries,
      notes,
      settings.config,
      periodEndDate,
    ),
  };
}

export async function sendExportRequest(
  payload: ExportPayload,
  settings: AppSettings,
): Promise<void> {
  const res = await fetch(settings.exportUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.todoistApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await res.text();

  if (!res.ok) {
    throw new Error(`Server responded with ${res.status}: ${res.statusText} - ${responseBody}`);
  }
}
