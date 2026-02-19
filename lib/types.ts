export interface MetricConfig {
  id: string;
  label: string;
  linkPackage: string | null;
  linkScheme: string | null;
}

export interface CategoryConfig {
  category: string;
  metrics: MetricConfig[];
}

export type ScoreValue = 0 | 0.5 | 1.0;

export type ScoresMap = Record<string, ScoreValue>;

export interface DailyEntry {
  date: string; // "YYYY-MM-DD"
  notes: string;
  scores: ScoresMap;
  is_archived: 0 | 1;
}

// Raw row from SQLite (scores is still a JSON string)
export interface DailyEntryRow {
  date: string;
  notes: string;
  scores: string;
  is_archived: number;
}

export interface AppSettings {
  config: CategoryConfig[];
  exportUrl: string;
}

export const DEFAULT_CONFIG: CategoryConfig[] = [
  {
    category: "Mental Health",
    metrics: [
      { id: "talk_friend", label: "Spoke to Friend", linkPackage: null, linkScheme: null },
      { id: "meditate", label: "Meditated", linkPackage: "com.calm.android", linkScheme: "calm://" },
    ],
  },
  {
    category: "Physical",
    metrics: [
      { id: "exercise", label: "Exercised", linkPackage: null, linkScheme: null },
      { id: "sleep_well", label: "Slept Well", linkPackage: null, linkScheme: null },
    ],
  },
];

export const DEFAULT_EXPORT_URL = "";
