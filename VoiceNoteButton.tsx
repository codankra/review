import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as SpeechRecognition from "./modules/speech-recognition";

export default function VoiceNoteButton() {
  const [isListening, setIsListening] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");

  useEffect(() => {
    const subscriptions = [
      SpeechRecognition.addListener("onReadyForSpeech", () => {
        console.log("Ready for speech");
      }),

      SpeechRecognition.addListener("onBeginningOfSpeech", () => {
        console.log("Speech started");
      }),

      SpeechRecognition.addListener("onEndOfSpeech", () => {
        console.log("Speech ended");
        setIsListening(false);
      }),

      SpeechRecognition.addListener("onError", ({ error }) => {
        console.error("Speech error:", error);
        setIsListening(false);
        Alert.alert("Error", error);
      }),

      SpeechRecognition.addListener("onResults", ({ transcript }) => {
        console.log("Final result:", transcript);
        setFinalTranscript(transcript);
        setPartialTranscript("");
      }),

      SpeechRecognition.addListener("onPartialResults", ({ transcript }) => {
        console.log("Partial result:", transcript);
        setPartialTranscript(transcript);
      }),
    ];

    return () => {
      subscriptions.forEach((sub) => sub.remove());
      SpeechRecognition.destroy();
    };
  }, []);

  const handlePress = async () => {
    if (isListening) {
      await SpeechRecognition.stop();
      setIsListening(false);
    } else {
      const available = await SpeechRecognition.isAvailable();
      if (!available) {
        Alert.alert("Error", "Speech recognition not available on this device");
        return;
      }

      try {
        await SpeechRecognition.start();
        setIsListening(true);
        setPartialTranscript("");
        setFinalTranscript("");
      } catch (error) {
        Alert.alert("Error", "Failed to start speech recognition");
        console.error(error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isListening && styles.buttonActive]}
        onPress={handlePress}
      >
        <Text style={styles.buttonText}>
          {isListening ? "🎤 Listening..." : "🎤 Tap to Speak"}
        </Text>
      </TouchableOpacity>

      {partialTranscript ? (
        <View style={styles.transcriptContainer}>
          <Text style={styles.label}>Listening:</Text>
          <Text style={styles.partialText}>{partialTranscript}</Text>
        </View>
      ) : null}

      {finalTranscript ? (
        <View style={styles.transcriptContainer}>
          <Text style={styles.label}>You said:</Text>
          <Text style={styles.finalText}>{finalTranscript}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: "center",
  },
  buttonActive: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  transcriptContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    width: "100%",
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  partialText: {
    fontSize: 16,
    color: "#999",
    fontStyle: "italic",
  },
  finalText: {
    fontSize: 16,
    color: "#000",
  },
});
