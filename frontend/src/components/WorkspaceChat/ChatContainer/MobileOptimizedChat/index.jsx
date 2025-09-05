import React, { useState, useEffect, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PaperPlaneRight as Send, 
  Plus, 
  Microphone as Mic, 
  MicrophoneSlash as MicOff,
  Image,
  Paperclip,
  Hash,
  At as AtSign,
  Sparkle as Sparkles,
  X,
  CaretDown as ChevronDown,
  Activity,
  Users,
  Lightning as Zap,
  Brain,
  Clock,
  TrendUp as TrendingUp,
  Robot as Bot,
  ChatCircle as MessageSquare,
  Gear as Settings,
  StopCircle,
  ArrowUp,
  Lightning,
  Command,
  FileText,
  Camera,
  CalendarCheck,
  Plug,
  Share
} from "@phosphor-icons/react";
import { isMobile } from "react-device-detect";
import ChatHistory from "../ChatHistory";
import { DndUploaderContext, CLEAR_ATTACHMENTS_EVENT } from "../DnDWrapper";
import PromptInput, { PROMPT_INPUT_EVENT, PROMPT_INPUT_ID } from "../PromptInput";
import SpeechToText from "../PromptInput/SpeechToText";
import AttachmentManager from "../PromptInput/Attachments";
import EnhancedMobileInput from "../EnhancedMobileInput";
import LLMSelectorModal from "../PromptInput/LLMSelector";
import ResponseModeSelector from "../PromptInput/ResponseModeSelector";
import { useResponseMode } from "../PromptInput/ResponseModeSelector";
// import AgentActivityIndicator from "../../AgentActivityIndicator";
// import SmartContextPills from "../../SmartContextPills";
import ChatWidgetHeader from "@/components/ChatWidgetHeader";

export default function MobileOptimizedChat({ 
  workspace,
  knownHistory = [],
  sendCommand,
  handleSubmit: parentHandleSubmit,
  message,
  setMessage,
  loadingResponse,
  chatHistory,
  setChatHistory,
  activeAgents = [],
  threadStats = {},
  performance = {},
  regenerateAssistantMessage
}) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [inputText, setInputText] = useState("");
  const [showAgentPills, setShowAgentPills] = useState(true);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const { responseMode, setResponseMode, showModeSelector, setShowModeSelector } = useResponseMode();
  const { files, parseAttachments } = useContext(DndUploaderContext);
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Handle viewport changes for keyboard
  useEffect(() => {
    if (!window.visualViewport) return;
    
    const handleViewportChange = () => {
      const keyboard = window.innerHeight - window.visualViewport.height;
      setKeyboardHeight(Math.max(0, keyboard));
      
      // Auto-scroll to bottom when keyboard appears
      if (keyboard > 0 && containerRef.current) {
        setTimeout(() => {
          const chatHistory = document.querySelector('.chat-history-container');
          if (chatHistory) {
            chatHistory.scrollTo({
              top: chatHistory.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    
    return () => {
      window.visualViewport.removeEventListener('resize', handleViewportChange);
      window.visualViewport.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // Sync with parent message state
  useEffect(() => {
    setInputText(message || "");
  }, [message]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || loadingResponse) return;
    
    // Haptic feedback
    navigator.vibrate?.([10]);
    
    // Create proper form event
    const formEvent = {
      preventDefault: () => {},
      target: {
        value: inputText
      }
    };
    
    // Update parent message state first
    setMessage(inputText);
    
    // Clear local input immediately
    setInputText("");
    setShowQuickActions(false);
    setShowAttachmentOptions(false);
    
    // Trigger parent's handleSubmit with the input text
    if (parentHandleSubmit) {
      // Set the textarea value for parent to read
      const textareaElement = document.getElementById('primary-prompt-input');
      if (textareaElement) {
        textareaElement.value = inputText;
      }
      parentHandleSubmit(formEvent);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputText(value);
    setMessage(value);
  };

  const handleVoiceToggle = () => {
    navigator.vibrate?.([20]);
    setIsRecording(!isRecording);
    // This would need to integrate with SpeechToText component
    // For now, it's a placeholder for voice recording UI
    if (!isRecording) {
      console.log("Voice recording started - STT integration needed");
      // TODO: Start SpeechRecognition.startListening()
    } else {
      console.log("Voice recording stopped - STT integration needed");
      // TODO: Stop SpeechRecognition.stopListening()
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      window.dispatchEvent(
        new CustomEvent('PASTE_ATTACHMENT_EVENT', {
          detail: { files }
        })
      );
    }
  };

  const quickActions = [
    { 
      icon: AtSign, 
      label: 'Agent', 
      action: () => {
        setInputText('@agent ');
        inputRef.current?.focus();
      }
    },
    { 
      icon: Hash, 
      label: 'Command', 
      action: () => {
        setInputText('/');
        inputRef.current?.focus();
      }
    },
    { 
      icon: Brain, 
      label: 'Model', 
      action: () => setShowModelSelector(true)
    },
    { 
      icon: responseMode === 'agent' ? Bot : Lightning, 
      label: responseMode === 'agent' ? 'Agent Mode' : 'Chat Mode', 
      action: () => setResponseMode(responseMode === 'agent' ? 'chat' : 'agent')
    },
  ];

  const attachmentOptions = [
    {
      icon: Image,
      label: 'Photo',
      action: () => imageInputRef.current?.click(),
      accept: 'image/*'
    },
    {
      icon: Camera,
      label: 'Camera',
      action: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = handleFileSelect;
        input.click();
      }
    },
    {
      icon: FileText,
      label: 'Document',
      action: () => fileInputRef.current?.click(),
      accept: '.pdf,.doc,.docx,.txt,.md'
    },
    {
      icon: Paperclip,
      label: 'Any File',
      action: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = handleFileSelect;
        input.click();
      }
    },
  ];

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative"
      style={{
        paddingBottom: keyboardHeight > 0 ? '0' : 'env(safe-area-inset-bottom)',
      }}
    >
      {/* ChatWidgetHeader - positioned to avoid whitespace */}
      <ChatWidgetHeader 
        workspace={workspace}
        connectors={[]} 
        enabledWidgets={["members", "connectors", "schedule", "share"]}
      />
      
      {/* Response Mode Indicator */}
      {responseMode === "agent" && (
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 py-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full border border-purple-500/20">
              <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                Agent Mode Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Agent Activity Indicator (floating) - Disabled */}
      {/* <AgentActivityIndicator 
        activeAgents={activeAgents}
        thinking={loadingResponse}
      /> */}

      {/* Chat Messages Area */}
      <div 
        className="flex-1 overflow-y-auto overscroll-behavior-contain chat-history-container"
        style={{
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '100px',
        }}
      >
        <ChatHistory
          history={chatHistory}
          workspace={workspace}
          sendCommand={sendCommand}
          updateHistory={setChatHistory}
          regenerateAssistantMessage={regenerateAssistantMessage}
          hasAttachments={files.length > 0}
        />
      </div>

      {/* Enhanced Mobile Input */}
      <EnhancedMobileInput
        sendCommand={sendCommand}
        onSend={(message) => {
          if (message.type === "text") {
            // Update the message state
            setMessage(message.content);
            
            // Create a proper event object for the parent's handleSubmit
            const formEvent = {
              preventDefault: () => {},
              target: {
                value: message.content
              }
            };
            
            // Set the textarea value for parent to read
            const textareaElement = document.getElementById('primary-prompt-input');
            if (textareaElement) {
              textareaElement.value = message.content;
            }
            
            // Call parent's handleSubmit
            if (parentHandleSubmit) {
              parentHandleSubmit(formEvent);
            }
          } else if (message.type === "voice") {
            // Handle voice message
            console.log("Voice message:", message);
          }
        }}
        onAttachment={(file) => {
          window.dispatchEvent(
            new CustomEvent('PASTE_ATTACHMENT_EVENT', {
              detail: { files: [file] }
            })
          );
        }}
        workspace={workspace}
        isStreaming={loadingResponse}
        responseMode={responseMode}
      />
      
      {/* Old input implementation - hidden but kept for reference */}
      <div className="hidden">
        {/* Attachments Display */}
        {files.length > 0 && (
          <AttachmentManager attachments={files} />
        )}

        {/* Quick Actions Tray */}
        <AnimatePresence>
          {showQuickActions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        navigator.vibrate?.([10]);
                        action.action();
                        setShowQuickActions(false);
                      }}
                      className="flex-shrink-0 flex flex-col items-center gap-1 p-3 min-w-[70px] rounded-xl bg-gray-50 dark:bg-gray-800 active:scale-95 transition-transform"
                    >
                      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {action.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachment Options Tray */}
        <AnimatePresence>
          {showAttachmentOptions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
                {attachmentOptions.map((option, index) => {
                  const Icon = option.icon;
                  return (
                    <motion.button
                      key={option.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        navigator.vibrate?.([10]);
                        option.action();
                        setShowAttachmentOptions(false);
                      }}
                      className="flex-shrink-0 flex flex-col items-center gap-1 p-3 min-w-[70px] rounded-xl bg-gray-50 dark:bg-gray-800 active:scale-95 transition-transform"
                    >
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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

        {/* Main Input Row */}
        <div className="flex items-end gap-2 p-3">
          {/* Attachment Button */}
          <button
            onClick={() => {
              navigator.vibrate?.([10]);
              setShowAttachmentOptions(!showAttachmentOptions);
              setShowQuickActions(false);
            }}
            className={`p-3 rounded-xl transition-all touch-manipulation ${
              showAttachmentOptions 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            } active:scale-95`}
            style={{ minWidth: '48px', minHeight: '48px' }}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Text Input Container */}
          <div className="flex-1 relative bg-gray-100 dark:bg-gray-800 rounded-2xl">
            <textarea
              ref={inputRef}
              id={PROMPT_INPUT_ID}
              value={inputText}
              onChange={handleInputChange}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={responseMode === "agent" ? "Ask AI agents anything..." : "Message..."}
              rows={1}
              className="w-full px-4 py-3 bg-transparent resize-none outline-none text-gray-900 dark:text-white placeholder-gray-500 text-base"
              style={{
                fontSize: '16px', // Prevent iOS zoom
                minHeight: '48px',
                maxHeight: '120px',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  // Add @agent prefix if in agent mode
                  if (responseMode === "agent" && !inputText.startsWith("@agent")) {
                    setInputText("@agent " + inputText);
                    setTimeout(() => handleSend(e), 10);
                  } else {
                    handleSend(e);
                  }
                }
              }}
            />
            
            {/* Character count */}
            {inputText.length > 100 && (
              <span className="absolute bottom-1 right-3 text-xs text-gray-400">
                {inputText.length}
              </span>
            )}
          </div>

          {/* Quick Actions Button */}
          <button
            onClick={() => {
              navigator.vibrate?.([10]);
              setShowQuickActions(!showQuickActions);
              setShowAttachmentOptions(false);
            }}
            className={`p-3 rounded-xl transition-all touch-manipulation ${
              showQuickActions 
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rotate-45' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            } active:scale-95`}
            style={{ minWidth: '48px', minHeight: '48px' }}
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Voice Button */}
          <button
            onClick={handleVoiceToggle}
            className={`p-3 rounded-xl transition-all touch-manipulation ${
              isRecording 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            } active:scale-95`}
            style={{ minWidth: '48px', minHeight: '48px' }}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Send Button */}
          <button
            onClick={(e) => {
              // Add @agent prefix if in agent mode before sending
              if (responseMode === "agent" && !inputText.startsWith("@agent")) {
                setInputText("@agent " + inputText);
                setTimeout(() => handleSend(e), 10);
              } else {
                handleSend(e);
              }
            }}
            disabled={!inputText.trim() || loadingResponse}
            className={`p-3 rounded-xl transition-all touch-manipulation ${
              inputText.trim() && !loadingResponse
                ? responseMode === "agent" 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg active:scale-95' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg active:scale-95' 
                : 'bg-gray-200 dark:bg-gray-700 opacity-50'
            }`}
            style={{ minWidth: '48px', minHeight: '48px' }}
          >
            {loadingResponse ? (
              <StopCircle className="w-5 h-5 text-white" />
            ) : responseMode === "agent" ? (
              <Bot className="w-5 h-5 text-white" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Smart Suggestions */}
        {inputFocused && inputText.startsWith('@') && (
          <div className="px-3 pb-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {['@agent', '@search', '@analyze', '@summarize'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    navigator.vibrate?.([10]);
                    setInputText(suggestion + ' ');
                    inputRef.current?.focus();
                  }}
                  className="flex-shrink-0 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium active:scale-95 transition-transform"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Smart Command Suggestions */}
        {inputFocused && inputText.startsWith('/') && (
          <div className="px-3 pb-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {['/reset', '/help', '/settings', '/workspace'].map((command) => (
                <button
                  key={command}
                  onClick={() => {
                    navigator.vibrate?.([10]);
                    setInputText(command + ' ');
                    inputRef.current?.focus();
                  }}
                  className="flex-shrink-0 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-medium active:scale-95 transition-transform"
                >
                  {command}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.txt,.md"
      />
      <input
        ref={imageInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*"
      />

      {/* Model Selector Modal */}
      {showModelSelector && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModelSelector(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-6"
            style={{ maxHeight: '70vh' }}
          >
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select AI Model
            </h2>
            <LLMSelectorModal tooltipRef={{ current: { close: () => setShowModelSelector(false) } }} />
          </motion.div>
        </div>
      )}
    </div>
  );
}