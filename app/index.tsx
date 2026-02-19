import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import MetricGrid from "../components/MetricGrid";
import ReflectionInput from "../components/ReflectionInput";
import PeriodHistory from "../components/PeriodHistory";

import { loadSettings } from "../lib/storage";
import {
  getActiveEntries,
  updateNotes,
  updateScore,
  archiveAllActive,
  ensureTodayRow,
  getTodayDateString,
} from "../lib/database";
import { AppSettings, DailyEntry, ScoreValue } from "../lib/types";

export default function DashboardScreen() {
  const db = useSQLiteContext();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [exporting, setExporting] = useState(false);

  const today = getTodayDateString();
  const todayEntry = entries.find((e) => e.date === today);

  // ─── Load everything ────────────────────────────────────────────
  const refresh = useCallback(async () => {
    const [s, activeEntries] = await Promise.all([
      loadSettings(),
      getActiveEntries(db),
    ]);
    setSettings(s);
    setEntries(activeEntries);
  }, [db]);

  // Initial load + reload when screen comes back into focus (e.g. after Settings)
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // If the app is brought back to foreground on a new day, seed today's row
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active") {
        await ensureTodayRow(db);
        await refresh();
      }
    });
    return () => sub.remove();
  }, [db, refresh]);

  // ─── Score tap handler ───────────────────────────────────────────
  const handleScoreChange = useCallback(
    async (date: string, metricId: string, value: ScoreValue) => {
      // Optimistic update
      setEntries((prev) =>
        prev.map((e) =>
          e.date === date ? { ...e, scores: { ...e.scores, [metricId]: value } } : e
        )
      );
      await updateScore(db, date, metricId, value);
    },
    [db]
  );

  // ─── Notes save ──────────────────────────────────────────────────
  const handleNotesSave = useCallback(
    async (text: string) => {
      await updateNotes(db, today, text);
    },
    [db, today]
  );

  // ─── Export logic ────────────────────────────────────────────────
  const handleExport = async () => {
    if (!settings?.exportUrl) {
      Alert.alert(
        "No Export URL",
        "Please set an export webhook URL in Settings before closing the period.",
        [
          { text: "Open Settings", onPress: () => router.push("/settings") },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    Alert.alert(
      "Close & Export Period",
      `This will export ${entries.length} day(s) and mark them as archived. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          style: "destructive",
          onPress: async () => {
            setExporting(true);
            try {
              const payload = {
                period_end_date: today,
                entries: entries.map((e) => ({
                  date: e.date,
                  notes: e.notes,
                  scores: e.scores,
                })),
              };

              const res = await fetch(settings.exportUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });

              if (!res.ok) {
                throw new Error(`Server responded with ${res.status}: ${res.statusText}`);
              }

              // Archive everything and refresh
              await archiveAllActive(db);
              await ensureTodayRow(db); // seed fresh today row
              await refresh();

              Alert.alert("Period Closed ✓", "Your data has been exported and the period has been reset.");
            } catch (e: any) {
              Alert.alert(
                "Export Failed",
                `${e.message}\n\nYour data has NOT been archived. You can retry.`
              );
            } finally {
              setExporting(false);
            }
          },
        },
      ]
    );
  };

  // ─── Render ──────────────────────────────────────────────────────
  if (!settings) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color="#BB86FC" />
        </View>
      </SafeAreaView>
    );
  }

  const periodLabel = (() => {
    if (entries.length === 0) return "No entries";
    if (entries.length === 1) return entries[0].date;
    return `${entries[0].date}  →  ${entries[entries.length - 1].date}`;
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.appTitle}>Theme Tracker</Text>
          <Text style={styles.periodLabel}>{periodLabel}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/settings")} style={styles.settingsBtn}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* ── Main scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Grid */}
        <View style={styles.gridContainer}>
          {settings.config.length === 0 ? (
            <Text style={styles.emptyConfig}>
              No metrics configured. Open Settings to add some.
            </Text>
          ) : entries.length === 0 ? (
            <ActivityIndicator color="#BB86FC" />
          ) : (
            <MetricGrid
              config={settings.config}
              entries={entries}
              onScoreChange={handleScoreChange}
            />
          )}
        </View>

        {/* Today's notes */}
        <ReflectionInput
          value={todayEntry?.notes ?? ""}
          onSave={handleNotesSave}
        />

        {/* Past notes accordion */}
        <PeriodHistory entries={entries} />

        {/* Spacer for footer */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
          onPress={handleExport}
          disabled={exporting}
          activeOpacity={0.8}
        >
          {exporting ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.exportBtnText}>Close & Export Period →</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  appTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#E0E0E0",
    letterSpacing: 0.5,
  },
  periodLabel: {
    fontSize: 11,
    color: "#555",
    marginTop: 1,
  },
  settingsBtn: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 22,
    color: "#888",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
  },
  gridContainer: {
    paddingHorizontal: 12,
    minHeight: 80,
  },
  emptyConfig: {
    color: "#555",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
    fontStyle: "italic",
  },
  footer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#1A1A1A",
    backgroundColor: "#0A0A0A",
  },
  exportBtn: {
    backgroundColor: "#BB86FC",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  exportBtnDisabled: {
    opacity: 0.6,
  },
  exportBtnText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
