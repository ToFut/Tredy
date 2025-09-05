import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
  PaperPlaneRight as Send,
  Microphone as Mic,
  MicrophoneSlash as MicOff,
  Image,
  Paperclip,
  Camera,
  MapPin,
  FileText,
  X,
  Pause,
  Play,
  Trash,
  ArrowUp,
  Plus,
  Hash,
  At,
  Smiley,
  Code,
  TextB as Bold,
  TextItalic as Italic,
  Link,
  Lightning,
  Bot,
  Command,
  Clock,
  Sparkle
} from "@phosphor-icons/react";

export default function EnhancedMobileInput({
  onSend,
  onAttachment,
  workspace,
  isStreaming = false,
  responseMode = "chat"
}) {
  // State management
  const [inputText, setInputText] = useState("");
  const [inputHeight, setInputHeight] = useState(48);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [voiceWaveform, setVoiceWaveform] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);

  // Refs
  const textareaRef = useRef(null);
  const recordingInterval = useRef(null);
  const animationController = useAnimation();
  const touchStartY = useRef(0);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  // Auto-expand textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "48px";
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(scrollHeight, 240); // Max 5 lines
      setInputHeight(newHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  // Handle text input changes
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputText(value);
    
    // Detect triggers for suggestions
    if (value.endsWith("@")) {
      setShowSuggestions("agents");
    } else if (value.endsWith("/")) {
      setShowSuggestions("commands");
    } else if (value.endsWith(":")) {
      setShowSuggestions("emoji");
    } else if (value.endsWith("#")) {
      setShowSuggestions("documents");
    } else if (!value.match(/[@/:#]$/)) {
      setShowSuggestions(false);
    }
  };
  
  // Handle paste events for auto-formatting
  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData("text");
    
    // Detect code blocks (multiple lines with indentation or common code patterns)
    const looksLikeCode = 
      (pastedText.includes("function") || 
       pastedText.includes("const ") || 
       pastedText.includes("import ") ||
       pastedText.includes("{") && pastedText.includes("}") ||
       pastedText.split("\n").length > 3 && pastedText.includes("  "));
    
    if (looksLikeCode) {
      e.preventDefault();
      const formattedCode = "```\n" + pastedText + "\n```";
      const newText = inputText + formattedCode;
      setInputText(newText);
      navigator.vibrate?.([20]);
    }
    
    // Detect URLs and auto-link them
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (urlPattern.test(pastedText)) {
      e.preventDefault();
      const formattedLink = `[Link](${pastedText})`;
      const newText = inputText + formattedLink;
      setInputText(newText);
      navigator.vibrate?.([20]);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        // Handle audio blob - send or preview
        handleVoiceMessage(audioBlob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Haptic feedback
      navigator.vibrate?.([50]);

      // Start waveform animation
      startWaveformAnimation();
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Microphone access required for voice messages");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(recordingInterval.current);
      navigator.vibrate?.([30]);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setRecordingTime(0);
    audioChunks.current = [];
    setDragDistance(0);
    navigator.vibrate?.([20, 10, 20]);
  };

  const handleVoiceMessage = (audioBlob) => {
    // Convert to base64 or handle upload
    console.log("Voice message recorded:", audioBlob);
    // You can preview or directly send the voice message
    if (onSend) {
      onSend({
        type: "voice",
        content: audioBlob,
        duration: recordingTime
      });
    }
  };

  // Waveform animation for recording
  const startWaveformAnimation = () => {
    const interval = setInterval(() => {
      if (isRecording) {
        const newWave = Array.from({ length: 20 }, () => 
          Math.random() * 40 + 10
        );
        setVoiceWaveform(newWave);
      }
    }, 100);
    
    return () => clearInterval(interval);
  };

  // Handle send message
  const handleSend = () => {
    if (!inputText.trim() || isStreaming) return;
    
    navigator.vibrate?.([20]);
    
    // Add response mode prefix if needed
    let message = inputText;
    if (responseMode === "agent" && !message.startsWith("@agent")) {
      message = "@agent " + message;
    }
    
    if (onSend) {
      onSend({
        type: "text",
        content: message
      });
    }
    
    setInputText("");
    setShowSuggestions(false);
    setShowAttachments(false);
  };

  // Format text selection
  const formatSelection = (format) => {
    if (!selectedText) return;
    
    let formattedText = "";
    switch (format) {
      case "bold":
        formattedText = `**${selectedText}**`;
        break;
      case "italic":
        formattedText = `*${selectedText}*`;
        break;
      case "code":
        formattedText = `\`${selectedText}\``;
        break;
      case "link":
        formattedText = `[${selectedText}](url)`;
        break;
      default:
        formattedText = selectedText;
    }
    
    const newText = 
      inputText.substring(0, cursorPosition) + 
      formattedText + 
      inputText.substring(cursorPosition + selectedText.length);
    
    setInputText(newText);
    setShowFormatting(false);
    navigator.vibrate?.([10]);
  };

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selected = selection.toString();
    
    if (selected && selected.length > 0) {
      setSelectedText(selected);
      setCursorPosition(textareaRef.current?.selectionStart || 0);
      setShowFormatting(true);
    } else {
      setShowFormatting(false);
    }
  };

  // Attachment options
  const attachmentOptions = [
    { icon: Image, label: "Photo", action: () => console.log("Photo") },
    { icon: Camera, label: "Camera", action: () => console.log("Camera") },
    { icon: FileText, label: "Document", action: () => console.log("Document") },
    { icon: MapPin, label: "Location", action: () => console.log("Location") }
  ];

  // Smart suggestions based on trigger
  const getSuggestions = () => {
    switch (showSuggestions) {
      case "agents":
        return ["@agent", "@search", "@analyze", "@summarize", "@translate"];
      case "commands":
        return ["/help", "/reset", "/settings", "/workspace", "/model"];
      case "emoji":
        return ["😊", "👍", "❤️", "🎉", "🤔", "💡", "✅", "🚀"];
      case "documents":
        return ["#recent", "#starred", "#shared", "#workspace", "#all"];
      default:
        return [];
    }
  };

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 transition-all duration-300 z-30"
         style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
      
      {/* Formatting Toolbar (appears on text selection) */}
      <AnimatePresence>
        {showFormatting && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-700 rounded-full px-2 py-1 flex gap-1 shadow-lg"
          >
            <button onClick={() => formatSelection("bold")} className="p-2 text-white hover:bg-gray-700 dark:hover:bg-gray-600 rounded-full">
              <Bold className="w-4 h-4" />
            </button>
            <button onClick={() => formatSelection("italic")} className="p-2 text-white hover:bg-gray-700 dark:hover:bg-gray-600 rounded-full">
              <Italic className="w-4 h-4" />
            </button>
            <button onClick={() => formatSelection("code")} className="p-2 text-white hover:bg-gray-700 dark:hover:bg-gray-600 rounded-full">
              <Code className="w-4 h-4" />
            </button>
            <button onClick={() => formatSelection("link")} className="p-2 text-white hover:bg-gray-700 dark:hover:bg-gray-600 rounded-full">
              <Link className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Suggestions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            <div className="flex gap-2 p-2 overflow-x-auto scrollbar-hide">
              {getSuggestions().map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    const newText = inputText.slice(0, -1) + suggestion + " ";
                    setInputText(newText);
                    setShowSuggestions(false);
                    textareaRef.current?.focus();
                    navigator.vibrate?.([10]);
                  }}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium whitespace-nowrap active:scale-95"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachment Menu */}
      <AnimatePresence>
        {showAttachments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 dark:border-gray-800"
          >
            <div className="grid grid-cols-4 gap-2 p-3">
              {attachmentOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <motion.button
                    key={option.label}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      option.action();
                      setShowAttachments(false);
                      navigator.vibrate?.([10]);
                    }}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl active:scale-95"
                  >
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {option.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Area */}
      <div className="flex items-end gap-2 p-3">
        {/* Attachment Button */}
        {!isRecording && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowAttachments(!showAttachments);
              navigator.vibrate?.([10]);
            }}
            className={`p-3 rounded-xl transition-all ${
              showAttachments 
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" 
                : "bg-gray-100 dark:bg-gray-800 text-gray-600"
            }`}
          >
            <Plus className={`w-5 h-5 transition-transform ${showAttachments ? "rotate-45" : ""}`} />
          </motion.button>
        )}

        {/* Voice Recording UI */}
        {isRecording ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex items-center gap-3 bg-red-50 dark:bg-red-900/20 rounded-2xl px-4 py-3"
            onTouchStart={(e) => touchStartY.current = e.touches[0].clientY}
            onTouchMove={(e) => {
              const diff = touchStartY.current - e.touches[0].clientY;
              setDragDistance(diff);
              if (diff > 100) {
                cancelRecording();
              }
            }}
            onTouchEnd={() => setDragDistance(0)}
          >
            <div className="flex items-center gap-2 flex-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-600 dark:text-red-400 font-medium">
                {formatTime(recordingTime)}
              </span>
              {dragDistance > 50 && (
                <span className="text-xs text-red-500 ml-2">
                  ↑ Slide to cancel
                </span>
              )}
            </div>
            
            {/* Waveform visualization */}
            <div className="flex items-center gap-0.5 flex-1">
              {voiceWaveform.map((height, i) => (
                <motion.div
                  key={i}
                  animate={{ height }}
                  className="w-1 bg-red-500 dark:bg-red-400 rounded-full"
                  style={{ minHeight: "4px" }}
                />
              ))}
            </div>
            
            <button
              onClick={cancelRecording}
              className="p-2 text-red-600 dark:text-red-400"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        ) : (
          <>
            {/* Text Input */}
            <div className="flex-1 relative">
              <motion.textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleInputChange}
                onPaste={handlePaste}
                onSelect={handleTextSelection}
                placeholder={responseMode === "agent" ? "Ask AI agents..." : "Type a message..."}
                className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 pr-12 resize-none outline-none text-gray-900 dark:text-white placeholder-gray-500 transition-all"
                style={{
                  fontSize: "16px",
                  lineHeight: "1.5",
                  minHeight: "48px",
                  maxHeight: "240px"
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              
              {/* Character counter */}
              {inputText.length > 200 && (
                <span className="absolute bottom-1 right-2 text-xs text-gray-400">
                  {inputText.length}/2000
                </span>
              )}
            </div>

            {/* Voice Toggle Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400"
            >
              <Mic className="w-5 h-5" />
            </motion.button>

            {/* Send Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!inputText.trim() || isStreaming}
              className={`p-3 rounded-xl transition-all ${
                inputText.trim() && !isStreaming
                  ? responseMode === "agent"
                    ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400"
              }`}
            >
              {isStreaming ? (
                <Clock className="w-5 h-5 animate-spin" />
              ) : responseMode === "agent" ? (
                <Bot className="w-5 h-5" />
              ) : (
                <ArrowUp className="w-5 h-5" weight="bold" />
              )}
            </motion.button>
          </>
        )}
      </div>

      {/* Quick Phrases (when input is empty) */}
      {!inputText && !isRecording && (
        <div className="px-3 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {["How can I help?", "Tell me more", "What's next?", "Show examples"].map((phrase) => (
              <button
                key={phrase}
                onClick={() => {
                  setInputText(phrase);
                  navigator.vibrate?.([10]);
                }}
                className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm whitespace-nowrap active:scale-95"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}