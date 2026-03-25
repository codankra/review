import React, { useState, memo } from "react";
import { Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

interface Props {
  onTranscript: (text: string) => void;
}

function VoiceNoteButtonComponent({ onTranscript }: Props) {
  const [isListening, setIsListening] = useState(false);

  const playStartSound = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const playStopSound = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  useSpeechRecognitionEvent("start", () => {
    console.log("Speech started");
    playStartSound();
  });

  useSpeechRecognitionEvent("audiostart", () => {
    console.log("Audio capturing started");
  });

  useSpeechRecognitionEvent("audioend", () => {
    console.log("Audio capturing ended");
  });

  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
    playStopSound();
  });

  useSpeechRecognitionEvent("result", (event) => {
    const result = event.results[0];
    if (!result || !event.isFinal) return;

    console.log("Result:", result.transcript);
    onTranscript(result.transcript);
  });

  useSpeechRecognitionEvent("nomatch", () => {
    console.log("No speech match");
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.error("Speech error:", event.error, event.message);
    setIsListening(false);
    Alert.alert("Error", event.message || event.error);
  });

  const handlePress = async () => {
    if (isListening) {
      await ExpoSpeechRecognitionModule.stop();
    } else {
      const permissions = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      if (!permissions.granted) {
        const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!result.granted) {
          Alert.alert("Error", "Speech recognition permission not granted");
          return;
        }
      }

      try {
        await ExpoSpeechRecognitionModule.start({
          lang: "en-US",
          interimResults: true,
          maxAlternatives: 1,
          continuous: false,
        });
        setIsListening(true);
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
      <Text style={[styles.buttonText, isListening && styles.buttonTextActive]}>
        {isListening ? "◉" : "🎤"}
      </Text>
    </TouchableOpacity>
  );
}

export default memo(VoiceNoteButtonComponent);

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
    backgroundColor: "#555",
  },
  buttonText: {
    fontSize: 20,
  },
  buttonTextActive: {
    color: "#FF4444",
  },
});
