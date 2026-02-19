import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation } from "react-native";
import { DailyEntry } from "../lib/types";
import { getTodayDateString } from "../lib/database";

interface Props {
  entries: DailyEntry[];
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export default function PeriodHistory({ entries }: Props) {
  const [expanded, setExpanded] = useState(false);
  const today = getTodayDateString();

  // Past entries with actual notes content
  const pastEntries = entries
    .filter((e) => e.date !== today)
    .reverse(); // newest first

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.toggle} onPress={toggle} activeOpacity={0.7}>
        <Text style={styles.toggleLabel}>Past Notes ({pastEntries.length})</Text>
        <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.list}>
          {pastEntries.length === 0 ? (
            <Text style={styles.emptyText}>No previous entries this period.</Text>
          ) : (
            pastEntries.map((entry) => (
              <View key={entry.date} style={styles.entryCard}>
                <Text style={styles.entryDate}>{formatDisplayDate(entry.date)}</Text>
                <Text style={styles.entryNotes}>
                  {entry.notes.trim() || <Text style={styles.emptyNotes}>(no notes)</Text>}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
  },
  toggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1A1A2E",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toggleLabel: {
    color: "#BB86FC",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  chevron: {
    color: "#BB86FC",
    fontSize: 12,
  },
  list: {
    backgroundColor: "#111",
    paddingVertical: 8,
  },
  entryCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#222",
  },
  entryDate: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64B5F6",
    marginBottom: 4,
  },
  entryNotes: {
    fontSize: 13,
    color: "#CCC",
    lineHeight: 18,
  },
  emptyNotes: {
    color: "#555",
    fontStyle: "italic",
  },
  emptyText: {
    color: "#555",
    fontSize: 13,
    textAlign: "center",
    padding: 16,
    fontStyle: "italic",
  },
});
