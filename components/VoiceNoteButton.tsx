import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as SpeechRecognition from "../modules/speech-recognition";

interface Props {
  onTranscript: (text: string) => void;
}

export default function VoiceNoteButton({ onTranscript }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");

  useEffect(() => {
    const subscriptions = [
      SpeechRecognition.addListener("onReadyForSpeech", () => {
        console.log("Ready for speech");
      }),

      SpeechRecognition.addListener("onBeginningOfSpeech", () => {
        console.log("Speech started");
      }),

      SpeechRecognition.addListener("onEndOfSpeech", () => {
        setIsListening(false);
      }),

      SpeechRecognition.addListener("onError", ({ error }) => {
        console.error("Speech error:", error);
        setIsListening(false);
        Alert.alert("Error", error);
      }),

      SpeechRecognition.addListener("onResults", ({ transcript }) => {
        console.log("Final result:", transcript);
        onTranscript(transcript);
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
  }, [onTranscript]);

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
      } catch (error) {
        Alert.alert("Error", "Failed to start speech recognition");
        console.error(error);
      }
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, isListening && styles.buttonActive]}
      onPress={handlePress}
    >
      <Text style={styles.buttonText}>
        {isListening ? "◉" : "🎤"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    backgroundColor: "#333",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonActive: {
    backgroundColor: "#BB86FC",
  },
  buttonText: {
    fontSize: 20,
  },
});
