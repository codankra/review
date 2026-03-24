import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import MetricGrid from "../components/MetricGrid";
import NotesList from "../components/NotesList";

import { loadSettings } from "../lib/storage";
import {
  getActiveEntries,
  updateScore,
  archiveAllActive,
  ensureTodayRow,
  getTodayDateString,
  getAllNotes,
  addNote,
  updateNote,
  deleteNote,
  clearAllNotes,
  generateDateRange,
} from "../lib/database";
import { buildExportPayload, sendExportRequest } from "../lib/export";
import { AppSettings, DailyEntry, ScoreValue, Note } from "../lib/types";

export default function DashboardScreen() {
  const db = useSQLiteContext();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [exporting, setExporting] = useState(false);

  const today = getTodayDateString();

  // ─── Load everything ────────────────────────────────────────────
  const refresh = useCallback(async () => {
    const [s, activeEntries, allNotes] = await Promise.all([
      loadSettings(),
      getActiveEntries(db),
      getAllNotes(db),
    ]);
    setSettings(s);

    // Generate full date range from earliest entry to today
    let displayEntries = activeEntries;
    if (activeEntries.length > 0) {
      const earliestDate = activeEntries[0].date;
      const allDates = generateDateRange(earliestDate, today);

      // Create a map of existing entries by date
      const entryMap = new Map(activeEntries.map((e) => [e.date, e]));

      // Fill in missing dates with empty entries
      displayEntries = allDates.map((date) => {
        const existing = entryMap.get(date);
        return existing || { date, scores: {}, is_archived: 0 as const };
      });
    }

    setEntries(displayEntries);
    setNotes(allNotes);
  }, [db, today]);

  // Initial load + reload when screen comes back into focus (e.g. after Settings)
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
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
          e.date === date
            ? { ...e, scores: { ...e.scores, [metricId]: value } }
            : e,
        ),
      );
      await updateScore(db, date, metricId, value);
    },
    [db],
  );

  // ─── Notes handlers ───────────────────────────────────────────────
  const handleAddNote = useCallback(
    async (text: string) => {
      const newNote = await addNote(db, text);
      setNotes((prev) => [newNote, ...prev]);
      Keyboard.dismiss();
    },
    [db],
  );

  const handleUpdateNote = useCallback(
    async (id: number, text: string) => {
      await updateNote(db, id, text);
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
    },
    [db],
  );

  const handleDeleteNote = useCallback(
    async (id: number) => {
      await deleteNote(db, id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    },
    [db],
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
        ],
      );
      return;
    }

    Alert.alert(
      "Close & Export Period",
      `This will export ${entries.length} day(s), archive them, and clear all notes. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          style: "destructive",
          onPress: async () => {
            setExporting(true);
            try {
              const payload = buildExportPayload(
                entries,
                notes,
                settings,
                today,
              );
              await sendExportRequest(payload, settings);

              // Archive entries, clear notes, and refresh
              await archiveAllActive(db);
              await clearAllNotes(db);
              await ensureTodayRow(db); // seed fresh today row
              await refresh();

              Alert.alert(
                "Period Closed ✓",
                "Your data has been exported and the period has been reset.",
              );
            } catch (e: any) {
              Alert.alert(
                "Export Failed",
                `${e.message}\n\nYour data has NOT been archived. You can retry.`,
              );
            } finally {
              setExporting(false);
            }
          },
        },
      ],
    );
  };

  // ─── Render ──────────────────────────────────────────────────────
  const insets = useSafeAreaInsets();

  if (!settings) {
    return (
      <View
        style={[
          styles.safe,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.loading}>
          <ActivityIndicator color="#BB86FC" />
        </View>
      </View>
    );
  }

  const periodLabel = (() => {
    if (entries.length === 0) return "No entries";
    if (entries.length === 1) return entries[0].date;
    return `${entries[0].date}  →  ${entries[entries.length - 1].date}`;
  })();

  return (
    <View
      style={[
        styles.safe,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.appTitle}>Theme Tracker</Text>
          <Text style={styles.periodLabel}>{periodLabel}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          style={styles.settingsBtn}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* ── Main scrollable content ── */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
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
            <View style={styles.emptyEntriesContainer}>
              <Text style={styles.emptyEntriesIcon}>🌿</Text>
              <Text style={styles.emptyEntriesTitle}>What a week!</Text>
              <Text style={styles.emptyEntriesText}>Take a moment to reflect.</Text>
            </View>
          ) : (
            <MetricGrid
              config={settings.config}
              entries={entries}
              onScoreChange={handleScoreChange}
            />
          )}
        </View>

        {/* Notes */}
        <NotesList
          notes={notes}
          onAdd={handleAddNote}
          onUpdate={handleUpdateNote}
          onDelete={handleDeleteNote}
        />

        {/* Spacer for footer */}
        <View style={{ height: 80 }} />
      </ScrollView>
      </KeyboardAvoidingView>

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
    </View>
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
  keyboardAvoid: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    overflow: "visible",
  },
  scrollContent: {
    paddingTop: 12,
  },
  gridContainer: {
    paddingHorizontal: 12,
    minHeight: 80,
    overflow: "visible",
  },
  emptyConfig: {
    color: "#555",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
    fontStyle: "italic",
  },
  emptyEntriesContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyEntriesIcon: {
    fontSize: 48,
    marginBottom: 4,
  },
  emptyEntriesTitle: {
    color: "#BB86FC",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  emptyEntriesText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
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
