import React, { useState, memo, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import VoiceNoteButton from "./VoiceNoteButton";

interface Props {
  onAdd: (text: string) => void;
}

function NoteInputComponent({ onAdd }: Props) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSubmitting) {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start(() => {
        setIsSubmitting(false);
      });
    }
  }, [isSubmitting, progressAnim]);

  const handleAdd = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    onAdd(trimmed);
    setText("");
  }, [text, onAdd, isSubmitting]);

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
            style={[styles.addBtn, isSubmitting && styles.addBtnSuccess]}
            disabled={isSubmitting || !text.trim()}
          >
            {isSubmitting ? (
              <>
                <Text style={[styles.addBtnText, styles.addBtnSuccessText]}>✓</Text>
                <View style={styles.progressBarContainer}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        }),
                      },
                    ]}
                  />
                </View>
              </>
            ) : (
              <Text style={styles.addBtnText}>+</Text>
            )}
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
    overflow: "hidden",
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnSuccess: {
    backgroundColor: "#4CAF50",
  },
  addBtnText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    lineHeight: 28,
  },
  addBtnSuccessText: {
    color: "#FFF",
  },
  progressBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FFF",
  },
});
