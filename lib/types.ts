export interface MetricConfig {
  id: string;
  label: string;
  weight: number; // importance weight for weighted category averages (default: 1)
  linkPackage: string | null;
  linkScheme: string | null;
}

export interface CategoryConfig {
  category: string;
  metrics: MetricConfig[];
}

export type ScoreValue = 0 | 0.5 | 1.0;

export type ScoresMap = Record<string, ScoreValue>;

export interface Note {
  id: number;
  text: string;
  created_at: string;
}

export interface DailyEntry {
  date: string; // "YYYY-MM-DD"
  scores: ScoresMap;
  is_archived: 0 | 1;
}

// Raw row from SQLite (scores is still a JSON string)
export interface DailyEntryRow {
  date: string;
  scores: string;
  is_archived: number;
}

export interface AppSettings {
  config: CategoryConfig[];
  exportUrl: string;
  todoistApiKey: string;
  todoistTaskId: string;
}

export const DEFAULT_CONFIG: CategoryConfig[] = [
  {
    category: "Mental Health",
    metrics: [
      {
        id: "talk_friend",
        label: "Spoke to Friend",
        weight: 1,
        linkPackage: null,
        linkScheme: null,
      },
      {
        id: "meditate",
        label: "Meditated",
        weight: 1,
        linkPackage: "com.calm.android",
        linkScheme: "calm://",
      },
    ],
  },
  {
    category: "Physical",
    metrics: [
      {
        id: "exercise",
        label: "Exercised",
        weight: 1,
        linkPackage: null,
        linkScheme: null,
      },
      {
        id: "sleep_well",
        label: "Slept Well",
        weight: 1,
        linkPackage: null,
        linkScheme: null,
      },
    ],
  },
];

export const DEFAULT_EXPORT_URL = "";
export const DEFAULT_TODOIST_API_KEY = "";
export const DEFAULT_TODOIST_TASK_ID = "";
