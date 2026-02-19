import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import * as Linking from "expo-linking";
import { CategoryConfig, DailyEntry, ScoreValue } from "../lib/types";
import { getTodayDateString } from "../lib/database";

interface Props {
  config: CategoryConfig[];
  entries: DailyEntry[];
  onScoreChange: (date: string, metricId: string, value: ScoreValue) => void;
}

// Cycle: 0 -> 0.5 -> 1.0 -> 0
function cycleScore(current: ScoreValue | undefined): ScoreValue {
  if (!current || current === 0) return 0.5;
  if (current === 0.5) return 1.0;
  return 0;
}

function scoreSymbol(score: ScoreValue | undefined): string {
  if (!score || score === 0) return "○";
  if (score === 0.5) return "◑";
  return "●";
}

function scoreColor(score: ScoreValue | undefined): string {
  if (!score || score === 0) return "#9E9E9E";
  if (score === 0.5) return "#FF9800";
  return "#4CAF50";
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00"); // force local
  const day = d.toLocaleDateString("en-US", { weekday: "short" });
  const num = d.getDate();
  return `${day}\n${num}`;
}

async function openLinkedApp(metric: { linkPackage: string | null; linkScheme: string | null; label: string }) {
  if (Platform.OS === "android" && metric.linkPackage) {
    try {
      await IntentLauncher.startActivityAsync("android.intent.action.MAIN", {
        packageName: metric.linkPackage,
        flags: 0x10000000, // FLAG_ACTIVITY_NEW_TASK
      });
      return;
    } catch {
      // fall through to URI scheme
    }
  }
  if (metric.linkScheme) {
    const canOpen = await Linking.canOpenURL(metric.linkScheme);
    if (canOpen) {
      await Linking.openURL(metric.linkScheme);
      return;
    }
  }
  if (metric.linkPackage || metric.linkScheme) {
    Alert.alert("App Not Found", `Could not open the app linked to "${metric.label}".`);
  }
}

export default function MetricGrid({ config, entries, onScoreChange }: Props) {
  const today = getTodayDateString();

  const handleCellPress = useCallback(
    (date: string, metricId: string, currentScore: ScoreValue | undefined) => {
      if (date !== today) return; // past dates are read-only
      onScoreChange(date, metricId, cycleScore(currentScore));
    },
    [today, onScoreChange]
  );

  const LABEL_WIDTH = 130;
  const CELL_WIDTH = 52;
  const ROW_HEIGHT = 44;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.outerScroll}>
      <View>
        {/* Date header row */}
        <View style={styles.headerRow}>
          <View style={[styles.labelCell, { width: LABEL_WIDTH }]} />
          {entries.map((entry) => (
            <View key={entry.date} style={[styles.dateHeader, { width: CELL_WIDTH }]}>
              <Text style={[styles.dateHeaderText, entry.date === today && styles.todayText]}>
                {formatDateHeader(entry.date)}
              </Text>
            </View>
          ))}
        </View>

        {/* Category + metric rows */}
        {config.map((cat) => (
          <View key={cat.category}>
            {/* Category header */}
            <View style={styles.categoryRow}>
              <Text style={styles.categoryLabel}>{cat.category}</Text>
            </View>

            {/* Metric rows */}
            {cat.metrics.map((metric) => (
              <View key={metric.id} style={[styles.metricRow, { height: ROW_HEIGHT }]}>
                {/* Metric label — tappable to open linked app */}
                <TouchableOpacity
                  style={[styles.labelCell, { width: LABEL_WIDTH }]}
                  onPress={() => openLinkedApp(metric)}
                  onLongPress={() => openLinkedApp(metric)}
                  activeOpacity={metric.linkPackage || metric.linkScheme ? 0.6 : 1}
                >
                  <Text
                    style={[
                      styles.metricLabel,
                      !!(metric.linkPackage || metric.linkScheme) && styles.linkedLabel,
                    ]}
                    numberOfLines={2}
                  >
                    {metric.label}
                    {(metric.linkPackage || metric.linkScheme) ? " ↗" : ""}
                  </Text>
                </TouchableOpacity>

                {/* Score cells */}
                {entries.map((entry) => {
                  const score = entry.scores[metric.id] as ScoreValue | undefined;
                  const isToday = entry.date === today;
                  return (
                    <TouchableOpacity
                      key={entry.date}
                      style={[styles.scoreCell, { width: CELL_WIDTH, height: ROW_HEIGHT }]}
                      onPress={() => handleCellPress(entry.date, metric.id, score)}
                      activeOpacity={isToday ? 0.5 : 1}
                    >
                      <Text style={[styles.scoreSymbol, { color: scoreColor(score) }]}>
                        {scoreSymbol(score)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerScroll: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 4,
    marginBottom: 4,
  },
  dateHeader: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  dateHeaderText: {
    fontSize: 11,
    color: "#AAA",
    textAlign: "center",
    lineHeight: 15,
  },
  todayText: {
    color: "#64B5F6",
    fontWeight: "700",
  },
  categoryRow: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: "#1A1A2E",
    marginTop: 8,
    marginBottom: 2,
    borderRadius: 4,
  },
  categoryLabel: {
    fontWeight: "700",
    fontSize: 12,
    color: "#BB86FC",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A2A2A",
  },
  labelCell: {
    justifyContent: "center",
    paddingRight: 8,
    paddingLeft: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: "#E0E0E0",
  },
  linkedLabel: {
    color: "#81D4FA",
  },
  scoreCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  scoreSymbol: {
    fontSize: 20,
  },
});
