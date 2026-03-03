import { NativeModule, requireOptionalNativeModule } from "expo";

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

// requireOptionalNativeModule returns null instead of throwing when the native
// module is unavailable (web, iOS, or Expo Go). requireNativeModule throws at
// module evaluation time and crashes the entire route before the default export
// is reached — that's the "missing default export" error you saw.
const NativeSpeechRecognition =
  requireOptionalNativeModule<SpeechRecognitionModule>("SpeechRecognition");

export function isAvailable(): Promise<boolean> {
  if (!NativeSpeechRecognition) return Promise.resolve(false);
  return NativeSpeechRecognition.isAvailable();
}

export function start(): Promise<void> {
  if (!NativeSpeechRecognition) return Promise.reject(new Error("SpeechRecognition native module not available"));
  return NativeSpeechRecognition.start();
}

export function stop(): Promise<void> {
  if (!NativeSpeechRecognition) return Promise.resolve();
  return NativeSpeechRecognition.stop();
}

export function cancel(): Promise<void> {
  if (!NativeSpeechRecognition) return Promise.resolve();
  return NativeSpeechRecognition.cancel();
}

export function destroy(): Promise<void> {
  if (!NativeSpeechRecognition) return Promise.resolve();
  return NativeSpeechRecognition.destroy();
}

export function addListener<K extends keyof SpeechRecognitionModuleEvents>(
  eventType: K,
  listener: SpeechRecognitionModuleEvents[K]
) {
  if (!NativeSpeechRecognition) return { remove: () => {} };
  return NativeSpeechRecognition.addListener(eventType, listener);
}


