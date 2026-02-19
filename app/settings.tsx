import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { loadSettings, saveSettings, parseAndValidateConfig } from "../lib/storage";
import { AppSettings } from "../lib/types";

export default function SettingsScreen() {
  const [configText, setConfigText] = useState("");
  const [exportUrl, setExportUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings().then((s) => {
      setConfigText(JSON.stringify(s.config, null, 2));
      setExportUrl(s.exportUrl);
    });
  }, []);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const config = parseAndValidateConfig(configText);
      const settings: AppSettings = { config, exportUrl: exportUrl.trim() };
      await saveSettings(settings);
      router.back();
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(configText), null, 2);
      setConfigText(formatted);
      setError(null);
    } catch {
      setError("Invalid JSON — cannot format.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>✕ Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            disabled={saving}
          >
            <Text style={styles.saveText}>{saving ? "Saving…" : "Save"}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Export URL */}
          <Text style={styles.label}>Export Webhook URL</Text>
          <TextInput
            style={styles.urlInput}
            value={exportUrl}
            onChangeText={setExportUrl}
            placeholder="https://your-endpoint.com/webhook"
            placeholderTextColor="#555"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          {/* Config JSON editor */}
          <View style={styles.configHeader}>
            <Text style={styles.label}>Metrics Config (JSON)</Text>
            <TouchableOpacity onPress={handleFormat} style={styles.formatBtn}>
              <Text style={styles.formatBtnText}>Format</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          )}

          <TextInput
            style={styles.jsonInput}
            value={configText}
            onChangeText={(t) => { setConfigText(t); setError(null); }}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textAlignVertical="top"
          />

          {/* Schema hint */}
          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>Schema Reference</Text>
            <Text style={styles.hintText}>{`[
  {
    "category": "Category Name",
    "metrics": [
      {
        "id": "unique_id",
        "label": "Display Name",
        "linkPackage": "com.app.package",
        "linkScheme": "appscheme://"
      }
    ]
  }
]`}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0A0A0A" },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E0E0E0",
  },
  cancelBtn: { padding: 4 },
  cancelText: { color: "#AAA", fontSize: 14 },
  saveBtn: {
    backgroundColor: "#BB86FC",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { color: "#000", fontWeight: "700", fontSize: 14 },
  content: { padding: 14, paddingBottom: 40 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#BB86FC",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },
  urlInput: {
    backgroundColor: "#1A1A2E",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    color: "#E0E0E0",
    fontSize: 14,
    padding: 12,
  },
  configHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  formatBtn: {
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#333",
    borderRadius: 4,
  },
  formatBtnText: { color: "#CCC", fontSize: 12 },
  errorBox: {
    backgroundColor: "#3E1010",
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#7F2020",
  },
  errorText: { color: "#FF6B6B", fontSize: 13 },
  jsonInput: {
    backgroundColor: "#0F1117",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    color: "#A8FF78",
    fontSize: 12,
    fontFamily: Platform.OS === "android" ? "monospace" : "Menlo",
    padding: 12,
    minHeight: 280,
    lineHeight: 18,
  },
  hintBox: {
    marginTop: 16,
    backgroundColor: "#0F1117",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    padding: 12,
  },
  hintTitle: { color: "#555", fontSize: 11, fontWeight: "600", marginBottom: 6 },
  hintText: {
    color: "#444",
    fontSize: 11,
    fontFamily: Platform.OS === "android" ? "monospace" : "Menlo",
    lineHeight: 17,
  },
});
