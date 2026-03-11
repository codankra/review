import { AppSettings, DailyEntry, Note } from "./types";

export interface ExportPayload {
  task_id: string;
  comment: string;
}

export function createReflectionMarkdown(
  entries: DailyEntry[],
  notes: Note[],
  periodEndDate: string,
): string {
  const dailyEntries = entries
    .map((e) => `${e.date}: ${JSON.stringify(e.scores)}`)
    .join("\n");

  const notesList = notes.map((n) => `- ${n.text}`).join("\n");

  return `# Weekly Review on ${periodEndDate}
## Ballpark Ratings
${dailyEntries}

## Reflections: Year of Fay
### What are you feeling good about?
### Any ideas for improvement?
### Think of anything to add to tasks?
${notesList}
`;
}

export function buildExportPayload(
  entries: DailyEntry[],
  notes: Note[],
  settings: AppSettings,
  periodEndDate: string,
): ExportPayload {
  return {
    task_id: settings.todoistTaskId,
    comment: createReflectionMarkdown(entries, notes, periodEndDate),
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

  if (!res.ok) {
    throw new Error(`Server responded with ${res.status}: ${res.statusText}`);
  }
}
