import React, { useState, useRef, useEffect } from "react";
import {
  PaperPlaneRight,
  Plus,
  Paperclip,
  Microphone,
  X,
} from "@phosphor-icons/react";

export default function ModernChatInterface({ onSendMessage, isStreaming }) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage({ text: message, attachments });
      setMessage("");
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setAttachments((prev) => [...prev, ...files]);
  };

  return (
    <div className="modern-chat-input">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border text-sm"
              >
                <span className="truncate max-w-[120px]">{file.name}</span>
                <button
                  onClick={() =>
                    setAttachments((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div className="p-4 bg-white border-t">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          {/* Action Buttons */}
          <div className="flex gap-2 pb-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Attach file"
            >
              <Paperclip className="w-5 h-5 text-gray-500" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Voice input"
            >
              <Microphone className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                adjustHeight();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-sm leading-relaxed"
              style={{ minHeight: "44px", maxHeight: "120px" }}
              rows={1}
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={
                isStreaming || (!message.trim() && attachments.length === 0)
              }
              className={`absolute right-2 bottom-2 p-2 rounded-full transition-all ${
                message.trim() || attachments.length > 0
                  ? "bg-blue-600 text-white hover:bg-blue-700 scale-100"
                  : "bg-gray-200 text-gray-400 scale-95"
              } ${isStreaming ? "animate-pulse" : ""}`}
            >
              <PaperPlaneRight className="w-4 h-4" />
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center mt-3">
          <div className="flex gap-2">
            {["✨ Summarize", "🔍 Analyze", "💡 Ideas"].map((action) => (
              <button
                key={action}
                onClick={() => setMessage(action.split(" ")[1])}
                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced message display
export function ModernMessage({ message, isBot, timestamp, isStreaming }) {
  return (
    <div className={`flex gap-3 p-4 ${isBot ? "bg-gray-50" : "bg-white"}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isBot ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
        }`}
      >
        {isBot ? "🤖" : "👤"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="prose max-w-none">
          {message}
          {isStreaming && (
            <span className="inline-block w-2 h-5 bg-blue-600 ml-1 animate-pulse" />
          )}
        </div>
        <div className="text-xs text-gray-500 mt-2">{timestamp}</div>
      </div>
    </div>
  );
}
