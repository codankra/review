import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AppSettings,
  CategoryConfig,
  DEFAULT_CONFIG,
  DEFAULT_EXPORT_URL,
  DEFAULT_TODOIST_API_KEY,
  DEFAULT_TODOIST_TASK_ID,
} from "./types";

const CONFIG_KEY = "app_config_v1";
const EXPORT_URL_KEY = "export_url_v1";
const TODOIST_API_KEY_KEY = "todoist_api_key_v1";
const TODOIST_TASK_ID_KEY = "todoist_task_id_v1";

export async function loadSettings(): Promise<AppSettings> {
  try {
    const [configRaw, exportUrl, todoistApiKey, todoistTaskId] =
      await AsyncStorage.multiGet([
        CONFIG_KEY,
        EXPORT_URL_KEY,
        TODOIST_API_KEY_KEY,
        TODOIST_TASK_ID_KEY,
      ]);
    const config: CategoryConfig[] = configRaw[1]
      ? JSON.parse(configRaw[1])
      : DEFAULT_CONFIG;
    return {
      config,
      exportUrl: exportUrl[1] ?? DEFAULT_EXPORT_URL,
      todoistApiKey: todoistApiKey[1] ?? DEFAULT_TODOIST_API_KEY,
      todoistTaskId: todoistTaskId[1] ?? DEFAULT_TODOIST_TASK_ID,
    };
  } catch {
    return {
      config: DEFAULT_CONFIG,
      exportUrl: DEFAULT_EXPORT_URL,
      todoistApiKey: DEFAULT_TODOIST_API_KEY,
      todoistTaskId: DEFAULT_TODOIST_TASK_ID,
    };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.multiSet([
    [CONFIG_KEY, JSON.stringify(settings.config)],
    [EXPORT_URL_KEY, settings.exportUrl],
    [TODOIST_API_KEY_KEY, settings.todoistApiKey],
    [TODOIST_TASK_ID_KEY, settings.todoistTaskId],
  ]);
}

/** Validates that a string is a valid CategoryConfig[] JSON array. Throws on invalid. */
export function parseAndValidateConfig(raw: string): CategoryConfig[] {
  const parsed = JSON.parse(raw); // throws on bad JSON
  if (!Array.isArray(parsed)) throw new Error("Config must be a JSON array.");
  for (const cat of parsed) {
    if (typeof cat.category !== "string")
      throw new Error("Each item needs a 'category' string.");
    if (!Array.isArray(cat.metrics))
      throw new Error(`Category '${cat.category}' needs a 'metrics' array.`);
    for (const m of cat.metrics) {
      if (!m.id || !m.label)
        throw new Error("Each metric needs 'id' and 'label'.");
    }
  }
  return parsed as CategoryConfig[];
}
