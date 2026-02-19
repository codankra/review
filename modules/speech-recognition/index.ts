import { NativeModule, requireNativeModule } from "expo";

export type SpeechRecognitionModuleEvents = {
  onReadyForSpeech: (params: null) => void;
  onBeginningOfSpeech: (params: null) => void;
  onEndOfSpeech: (params: null) => void;
  onError: (params: { error: string }) => void;
  onResults: (params: { transcript: string }) => void;
  onPartialResults: (params: { transcript: string }) => void;
};

declare class SpeechRecognitionModule extends NativeModule<SpeechRecognitionModuleEvents> {
  isAvailable(): Promise<boolean>;
  start(): Promise<void>;
  stop(): Promise<void>;
  cancel(): Promise<void>;
  destroy(): Promise<void>;
}

const NativeSpeechRecognition = requireNativeModule<SpeechRecognitionModule>("SpeechRecognition");

export function isAvailable(): Promise<boolean> {
  return NativeSpeechRecognition.isAvailable();
}

export function start(): Promise<void> {
  return NativeSpeechRecognition.start();
}

export function stop(): Promise<void> {
  return NativeSpeechRecognition.stop();
}

export function cancel(): Promise<void> {
  return NativeSpeechRecognition.cancel();
}

export function destroy(): Promise<void> {
  return NativeSpeechRecognition.destroy();
}

export function addListener<K extends keyof SpeechRecognitionModuleEvents>(
  eventType: K,
  listener: SpeechRecognitionModuleEvents[K]
) {
  return NativeSpeechRecognition.addListener(eventType, listener);
}


