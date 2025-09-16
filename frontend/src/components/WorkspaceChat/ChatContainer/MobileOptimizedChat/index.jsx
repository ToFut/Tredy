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
  TrendingUp,
  ChartLine,
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
import LLMSelectorModal from "../PromptInput/LLMSelector";
import ResponseModeSelector from "../PromptInput/ResponseModeSelector";
import { useResponseMode } from "../PromptInput/ResponseModeSelector";
// import AgentActivityIndicator from "../../AgentActivityIndicator";
// import SmartContextPills from "../../SmartContextPills";
// ChatWidgetHeader removed - using fixed header from parent ChatContainer

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
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showAgentPills, setShowAgentPills] = useState(true);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const { responseMode, setResponseMode, showModeSelector, setShowModeSelector } = useResponseMode();
  const { files, parseAttachments } = useContext(DndUploaderContext);
  
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Handle viewport changes for keyboard and auto-scrolling
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const chatContainer = document.querySelector('.chat-history-container');
    if (!chatContainer) return;

    // Check if user is near bottom (within 100px)
    const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100;
    
    // Auto-scroll only if user is near bottom or it's a new conversation
    if (isNearBottom || chatHistory.length <= 1) {
      setTimeout(() => {
        chatContainer.scrollTo({
          top: chatContainer.scrollHeight,
          behavior: 'smooth'
        });
      }, 50);
    }
  }, [chatHistory]);

  // Sync with parent message state


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

  // Detect if we're in homepage context by checking for homepage elements
  const isInHomepage = typeof window !== 'undefined' && 
    (window.location.pathname === '/' || window.location.pathname === '/home');
  
  return (
    <>
      <div 
        ref={containerRef}
        className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative"
        style={{
          paddingBottom: keyboardHeight > 0 ? '0' : 'env(safe-area-inset-bottom)',
          paddingTop: isInHomepage ? '0' : 'env(safe-area-inset-top)',
        }}
      >
      {/* Header is handled by parent context - homepage header or ChatWidgetHeader */}
      
      {/* Response Mode Indicator */}
      {responseMode === "agent" && (
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 py-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full border border-purple-500/20">
              <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
              <span className="text-sm sm:text-xs font-medium text-purple-700 dark:text-purple-300">
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
          transform: 'translate3d(0,0,0)', // Hardware acceleration for smooth scrolling
          // Ensure proper height calculation for mobile
          height: '100%',
          minHeight: 0, // Critical for flex child scrolling
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

      {/* Use Original PromptInput for mobile */}
      <div className="w-full">
        <PromptInput
          submit={parentHandleSubmit}
          onChange={(e) => setMessage(e.target.value)}
          isStreaming={loadingResponse}
          sendCommand={sendCommand}
          attachments={files}
        />
      </div>

      {/* Model Selector Modal - Keep this for LLM selection */}
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

      </div>

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
    </>
  );
}