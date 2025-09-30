import { useEffect, useCallback, useRef, useState } from "react";
import { Microphone, MicrophoneSlash, X } from "@phosphor-icons/react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import Appearance from "@/models/appearance";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Mobile-optimized Speech-to-Text component
 * Provides real-time transcription and appends text to input
 */
export default function MobileSpeechToText({
  onTranscript,
  onClose,
  isVisible = false,
}) {
  const previousTranscriptRef = useRef("");
  const [isListening, setIsListening] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingInterval = useRef(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    browserSupportsContinuousListening,
    isMicrophoneAvailable,
  } = useSpeechRecognition({
    clearTranscriptOnListen: true,
  });

  // Start STT session
  const startSTTSession = async () => {
    // Request microphone permission on mobile
    if (window.innerWidth < 768) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        alert("Microphone access is required for speech-to-text.");
        return;
      }
    }

    if (!isMicrophoneAvailable) {
      alert("Please enable microphone access for this feature.");
      return;
    }

    resetTranscript();
    previousTranscriptRef.current = "";
    setRecordingTime(0);
    setIsListening(true);

    SpeechRecognition.startListening({
      continuous: browserSupportsContinuousListening,
      language: window?.navigator?.language ?? "en-US",
    });

    // Start recording timer
    recordingInterval.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    navigator.vibrate?.([50]);
  };

  // End STT session
  const endSTTSession = () => {
    SpeechRecognition.stopListening();
    setIsListening(false);
    clearInterval(recordingInterval.current);

    // If auto-submit is enabled, trigger send
    if (Appearance.get("autoSubmitSttInput") && transcript.length > 0) {
      onTranscript(transcript, true); // true = auto-submit
    }

    resetTranscript();
    previousTranscriptRef.current = "";
    setRecordingTime(0);
    navigator.vibrate?.([30]);

    if (onClose) onClose();
  };

  // Cancel recording
  const cancelRecording = () => {
    SpeechRecognition.stopListening();
    setIsListening(false);
    clearInterval(recordingInterval.current);
    resetTranscript();
    previousTranscriptRef.current = "";
    setRecordingTime(0);
    navigator.vibrate?.([20, 10, 20]);

    if (onClose) onClose();
  };

  // Stream transcript updates to parent
  useEffect(() => {
    if (transcript?.length > 0 && listening) {
      const previousTranscript = previousTranscriptRef.current;
      const newContent = transcript.slice(previousTranscript.length);

      // Stream just the new content
      if (newContent.length > 0 && onTranscript) {
        onTranscript(newContent, false); // false = append mode
      }

      previousTranscriptRef.current = transcript;
    }
  }, [transcript, listening, onTranscript]);

  // Auto-start when visible
  useEffect(() => {
    if (isVisible && !listening) {
      startSTTSession();
    } else if (!isVisible && listening) {
      endSTTSession();
    }
  }, [isVisible]);

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!browserSupportsSpeechRecognition) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center"
          onClick={cancelRecording}
        >
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isListening ? "Listening..." : "Voice Input"}
              </h3>
              <button
                onClick={cancelRecording}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Recording Indicator */}
            {isListening && (
              <div className="flex flex-col items-center py-8">
                <div className="relative mb-4">
                  <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center animate-pulse">
                    <Microphone className="w-12 h-12 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </div>

                <div className="text-2xl font-mono text-gray-900 dark:text-white mb-2">
                  {formatTime(recordingTime)}
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Speak clearly into your microphone
                </p>

                {/* Waveform visualization placeholder */}
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 30 + 10}px`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Transcript Preview */}
            {transcript.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transcript:
                </h4>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg max-h-32 overflow-y-auto">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {transcript}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={cancelRecording}
                className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-medium"
              >
                Cancel
              </button>

              {isListening ? (
                <button
                  onClick={endSTTSession}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <MicrophoneSlash className="w-5 h-5" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={startSTTSession}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <Microphone className="w-5 h-5" />
                  Start
                </button>
              )}
            </div>

            {/* Auto-submit indicator */}
            {Appearance.get("autoSubmitSttInput") && (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                Auto-submit enabled - will send after you stop speaking
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
