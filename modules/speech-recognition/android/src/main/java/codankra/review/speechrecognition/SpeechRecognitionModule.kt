package codankra.review.speechrecognition

import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.core.os.bundleOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Locale

class SpeechRecognitionModule : Module() {
  private var speechRecognizer: SpeechRecognizer? = null
  private var isListening = false

  override fun definition() = ModuleDefinition {
    Name("SpeechRecognition")

    Events("onReadyForSpeech", "onBeginningOfSpeech", "onEndOfSpeech", "onError", "onResults", "onPartialResults")

    AsyncFunction("isAvailable") {
      return@AsyncFunction SpeechRecognizer.isRecognitionAvailable(appContext.reactContext)
    }

    AsyncFunction("start") {
      if (isListening) {
        throw Exception("ALREADY_LISTENING: Speech recognition is already active")
      }

      val context = appContext.reactContext ?: throw Exception("Context not available")

      if (speechRecognizer == null) {
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
          setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {
              sendEvent("onReadyForSpeech", null)
            }

            override fun onBeginningOfSpeech() {
              sendEvent("onBeginningOfSpeech", null)
            }

            override fun onRmsChanged(rmsdB: Float) {}

            override fun onBufferReceived(buffer: ByteArray?) {}

            override fun onEndOfSpeech() {
              isListening = false
              sendEvent("onEndOfSpeech", null)
            }

            override fun onError(error: Int) {
              isListening = false
              sendEvent("onError", bundleOf("error" to getErrorText(error)))
            }

            override fun onResults(results: Bundle?) {
              isListening = false
              val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
              if (!matches.isNullOrEmpty()) {
                sendEvent("onResults", bundleOf("transcript" to matches[0]))
              }
            }

            override fun onPartialResults(partialResults: Bundle?) {
              val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
              if (!matches.isNullOrEmpty()) {
                sendEvent("onPartialResults", bundleOf("transcript" to matches[0]))
              }
            }

            override fun onEvent(eventType: Int, params: Bundle?) {}
          })
        }
      }

      val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
        putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
      }

      speechRecognizer?.startListening(intent)
      isListening = true
    }

    AsyncFunction("stop") {
      if (speechRecognizer != null && isListening) {
        speechRecognizer?.stopListening()
        isListening = false
      }
    }

    AsyncFunction("cancel") {
      if (speechRecognizer != null) {
        speechRecognizer?.cancel()
        isListening = false
      }
    }

    AsyncFunction("destroy") {
      speechRecognizer?.destroy()
      speechRecognizer = null
      isListening = false
    }
  }

  private fun getErrorText(errorCode: Int): String = when (errorCode) {
    SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
    SpeechRecognizer.ERROR_CLIENT -> "Client side error"
    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
    SpeechRecognizer.ERROR_NETWORK -> "Network error"
    SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
    SpeechRecognizer.ERROR_NO_MATCH -> "No speech match"
    SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognition service busy"
    SpeechRecognizer.ERROR_SERVER -> "Server error"
    SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input"
    else -> "Unknown error"
  }
}
