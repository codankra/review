import React, { useState, memo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";
import VoiceNoteButton from "./VoiceNoteButton";

interface Props {
  onAdd: (text: string) => void;
}

function NoteInputComponent({ onAdd }: Props) {
  const [text, setText] = useState("");

  const handleAdd = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
  }, [text, onAdd]);

  const handleVoiceTranscript = useCallback((transcript: string) => {
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
  }, []);

  return (
    <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={0}>
      <View style={styles.addContainer}>
        <TextInput
          style={styles.addInput}
          value={text}
          onChangeText={setText}
          placeholder="Add a note..."
          placeholderTextColor="#555"
          multiline
        />
        <View style={styles.buttonsContainer}>
          <VoiceNoteButton onTranscript={handleVoiceTranscript} />
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addBtn, !text.trim() && styles.addBtnDisabled]}
            disabled={!text.trim()}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export default memo(NoteInputComponent);

const styles = StyleSheet.create({
  addContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    justifyContent: "center",
    marginLeft: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: "#1A1A2E",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    color: "#E0E0E0",
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
    minHeight: 50,
    maxHeight: 100,
  },
  addBtn: {
    width: 44,
    height: 44,
    backgroundColor: "#BB86FC",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    lineHeight: 28,
  },
});
