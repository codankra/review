import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

interface Props {
  value: string;
  onSave: (text: string) => void;
}

const DEBOUNCE_MS = 800;

export default function ReflectionInput({ value, onSave }: Props) {
  const [localText, setLocalText] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync if external value changes (e.g. date rollover)
  useEffect(() => {
    setLocalText(value);
  }, [value]);

  const handleChange = (text: string) => {
    setLocalText(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSave(text), DEBOUNCE_MS);
  };

  const handleBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onSave(localText);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Today's Notes</Text>
      <TextInput
        style={styles.input}
        value={localText}
        onChangeText={handleChange}
        onBlur={handleBlur}
        multiline
        placeholder="Gratitude, thoughts, brain dump…"
        placeholderTextColor="#555"
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginHorizontal: 12,
  },
  header: {
    fontSize: 14,
    fontWeight: "700",
    color: "#BB86FC",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1A1A2E",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    color: "#E0E0E0",
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
    minHeight: 120,
  },
});
