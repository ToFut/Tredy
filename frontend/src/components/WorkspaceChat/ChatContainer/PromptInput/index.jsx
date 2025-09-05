import React, { useState, useRef, useEffect } from "react";
import SlashCommandsButton, {
  SlashCommands,
  useSlashCommands,
} from "./SlashCommands";
import debounce from "lodash.debounce";
import { PaperPlaneRight, Lightning, Sparkle, Brain, ArrowUp } from "@phosphor-icons/react";
import StopGenerationButton from "./StopGenerationButton";
import AvailableAgentsButton, {
  AvailableAgents,
  useAvailableAgents,
} from "./AgentMenu";
import TextSizeButton from "./TextSizeMenu";
import LLMSelectorAction from "./LLMSelector/action";
import SpeechToText from "./SpeechToText";
import { Tooltip } from "react-tooltip";
import AttachmentManager from "./Attachments";
import AttachItem from "./AttachItem";
import {
  ATTACHMENTS_PROCESSED_EVENT,
  ATTACHMENTS_PROCESSING_EVENT,
  PASTE_ATTACHMENT_EVENT,
} from "../DnDWrapper";
import useTextSize from "@/hooks/useTextSize";
import { useTranslation } from "react-i18next";
import Appearance from "@/models/appearance";
import ResponseModeSelector, { useResponseMode } from "./ResponseModeSelector";

export const PROMPT_INPUT_ID = "primary-prompt-input";
export const PROMPT_INPUT_EVENT = "set_prompt_input";
const MAX_EDIT_STACK_SIZE = 100;

export default function PromptInput({
  submit,
  onChange,
  isStreaming,
  sendCommand,
  attachments = [],
}) {
  const { t } = useTranslation();
  const { isDisabled } = useIsDisabled();
  const [promptInput, setPromptInput] = useState("");
  const { showAgents, setShowAgents } = useAvailableAgents();
  const { showSlashCommand, setShowSlashCommand } = useSlashCommands();
  const { responseMode, setResponseMode, showModeSelector, setShowModeSelector } = useResponseMode();
  const formRef = useRef(null);
  const textareaRef = useRef(null);
  const [isFocused, setFocused] = useState(false);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const { textSizeClass } = useTextSize();
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  /**
   * To prevent too many re-renders we remotely listen for updates from the parent
   * via an event cycle. Otherwise, using message as a prop leads to a re-render every
   * change on the input.
   * @param {{detail: {messageContent: string, writeMode: 'replace' | 'append'}}} e
   */
  function handlePromptUpdate(e) {
    const { messageContent, writeMode = "replace" } = e?.detail ?? {};
    if (writeMode === "append") setPromptInput((prev) => prev + messageContent);
    else setPromptInput(messageContent ?? "");
  }

  useEffect(() => {
    if (!!window)
      window.addEventListener(PROMPT_INPUT_EVENT, handlePromptUpdate);
    return () =>
      window?.removeEventListener(PROMPT_INPUT_EVENT, handlePromptUpdate);
  }, []);

  useEffect(() => {
    if (!isStreaming && textareaRef.current) textareaRef.current.focus();
    resetTextAreaHeight();
  }, [isStreaming]);

  // Handle mobile viewport changes (keyboard show/hide)
  useEffect(() => {
    const handleViewportChange = () => {
      const newHeight = window.innerHeight;
      setViewportHeight(newHeight);
      
      // Scroll to input when keyboard opens on mobile
      if (isFocused && textareaRef.current && newHeight < viewportHeight) {
        setTimeout(() => {
          textareaRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 300);
      }
    };

    // Listen for viewport changes (mobile keyboard)
    window.addEventListener('resize', handleViewportChange);
    window.visualViewport?.addEventListener('resize', handleViewportChange);
    
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
    };
  }, [isFocused, viewportHeight]);

  /**
   * Save the current state before changes
   * @param {number} adjustment
   */
  function saveCurrentState(adjustment = 0) {
    if (undoStack.current.length >= MAX_EDIT_STACK_SIZE)
      undoStack.current.shift();
    undoStack.current.push({
      value: promptInput,
      cursorPositionStart: textareaRef.current.selectionStart + adjustment,
      cursorPositionEnd: textareaRef.current.selectionEnd + adjustment,
    });
  }
  const debouncedSaveState = debounce(saveCurrentState, 250);

  function handleSubmit(e) {
    e.preventDefault();
    setFocused(false);
    
    // Modify the textarea value to include @agent prefix if in agent mode
    // This needs to happen BEFORE the parent's submit handler reads the value
    if (responseMode === "agent" && !promptInput.startsWith("@agent")) {
      const messageWithAgent = "@agent " + promptInput;
      textareaRef.current.value = messageWithAgent;
      setPromptInput(messageWithAgent);
    }
    
    submit(e);
  }

  function resetTextAreaHeight() {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
  }

  function checkForSlash(e) {
    const input = e.target.value;
    if (input === "/") setShowSlashCommand(true);
    if (showSlashCommand) setShowSlashCommand(false);
    return;
  }
  const watchForSlash = debounce(checkForSlash, 300);

  function checkForAt(e) {
    const input = e.target.value;
    if (input === "@") return setShowAgents(true);
    if (showAgents) return setShowAgents(false);
  }
  const watchForAt = debounce(checkForAt, 300);

  /**
   * Capture enter key press to handle submission, redo, or undo
   * via keyboard shortcuts
   * @param {KeyboardEvent} event
   */
  function captureEnterOrUndo(event) {
    // Is simple enter key press w/o shift key
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      if (isStreaming || isDisabled) return; // Prevent submission if streaming or disabled
      
      // Add @agent prefix if in agent mode before submitting
      if (responseMode === "agent" && !promptInput.startsWith("@agent")) {
        const messageWithAgent = "@agent " + promptInput;
        textareaRef.current.value = messageWithAgent;
        setPromptInput(messageWithAgent);
      }
      
      return submit(event);
    }

    // Is undo with Ctrl+Z or Cmd+Z + Shift key = Redo
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "z" &&
      event.shiftKey
    ) {
      event.preventDefault();
      if (redoStack.current.length === 0) return;

      const nextState = redoStack.current.pop();
      if (!nextState) return;

      undoStack.current.push({
        value: promptInput,
        cursorPositionStart: textareaRef.current.selectionStart,
        cursorPositionEnd: textareaRef.current.selectionEnd,
      });
      setPromptInput(nextState.value);
      setTimeout(() => {
        textareaRef.current.setSelectionRange(
          nextState.cursorPositionStart,
          nextState.cursorPositionEnd
        );
      }, 0);
    }

    // Undo with Ctrl+Z or Cmd+Z
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "z" &&
      !event.shiftKey
    ) {
      if (undoStack.current.length === 0) return;
      const lastState = undoStack.current.pop();
      if (!lastState) return;

      redoStack.current.push({
        value: promptInput,
        cursorPositionStart: textareaRef.current.selectionStart,
        cursorPositionEnd: textareaRef.current.selectionEnd,
      });
      setPromptInput(lastState.value);
      setTimeout(() => {
        textareaRef.current.setSelectionRange(
          lastState.cursorPositionStart,
          lastState.cursorPositionEnd
        );
      }, 0);
    }
  }

  function adjustTextArea(event) {
    const element = event.target;
    element.style.height = "auto";
    const newHeight = Math.min(element.scrollHeight, 240); // Max height ~10 lines
    element.style.height = `${newHeight}px`;
    
    // Add smooth transition for height changes
    element.style.transition = "height 0.2s ease-out";
  }

  function handlePasteEvent(e) {
    e.preventDefault();
    if (e.clipboardData.items.length === 0) return false;

    // paste any clipboard items that are images.
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        window.dispatchEvent(
          new CustomEvent(PASTE_ATTACHMENT_EVENT, {
            detail: { files: [file] },
          })
        );
        continue;
      }

      // handle files specifically that are not images as uploads
      if (item.kind === "file") {
        const file = item.getAsFile();
        window.dispatchEvent(
          new CustomEvent(PASTE_ATTACHMENT_EVENT, {
            detail: { files: [file] },
          })
        );
        continue;
      }
    }

    const pasteText = e.clipboardData.getData("text/plain");
    if (pasteText) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newPromptInput =
        promptInput.substring(0, start) +
        pasteText +
        promptInput.substring(end);
      setPromptInput(newPromptInput);
      onChange({ target: { value: newPromptInput } });

      // Set the cursor position after the pasted text
      // we need to use setTimeout to prevent the cursor from being set to the end of the text
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd =
          start + pasteText.length;
      }, 0);
    }
    return;
  }

  function handleChange(e) {
    debouncedSaveState(-1);
    onChange(e);
    watchForSlash(e);
    watchForAt(e);
    adjustTextArea(e);
    setPromptInput(e.target.value);
  }

  return (
    <div className="w-full flex-shrink-0 flex flex-col justify-center items-center backdrop-blur-lg relative z-10">
      <SlashCommands
        showing={showSlashCommand}
        setShowing={setShowSlashCommand}
        sendCommand={sendCommand}
        promptRef={textareaRef}
      />
      <AvailableAgents
        showing={showAgents}
        setShowing={setShowAgents}
        sendCommand={sendCommand}
        promptRef={textareaRef}
      />
      
      {/* Mobile optimized input container */}
      <form
        onSubmit={handleSubmit}
        className="w-full bg-gradient-to-t from-white/95 via-white/90 to-transparent backdrop-blur-xl dark:from-gray-900/95 dark:via-gray-900/90 border-t border-gray-200/50 dark:border-gray-800/50 shadow-[0_-8px_16px_-6px_rgba(0,0,0,0.1)] dark:shadow-[0_-8px_16px_-6px_rgba(0,0,0,0.3)] safe-bottom"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)', // iOS safe area
        }}
      >
        <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 md:py-6">
          {/* Response mode indicator - Mobile optimized */}
          {responseMode === "agent" && (
            <div className="flex items-center justify-center mb-2 sm:mb-3 px-1 sm:px-2">
              <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full border border-purple-200 dark:border-purple-800">
                <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Agent Mode</span>
                <Sparkle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 animate-pulse" />
              </div>
            </div>
          )}
          
          <div className="relative">
            <div className="relative flex items-end bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-2 border-gray-200/30 dark:border-gray-700/30 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl hover:border-purple-300/50 transition-all duration-300 overflow-hidden group"
                 style={{ 
                   minHeight: '52px',
                   maxWidth: isFocused && window.innerWidth < 640 ? '100%' : undefined
                 }}>
              <AttachmentManager attachments={attachments} />
              
              <div className="flex items-end w-full">
                {/* Compact mobile tools with smart layout */}
                <div className={`flex items-center gap-0.5 sm:gap-1 md:gap-1.5 p-1.5 sm:p-2 md:p-3 ${isFocused && window.innerWidth < 640 ? 'scale-75 origin-left' : ''}`}>
                  <div className="hidden sm:block">
                    <AttachItem />
                  </div>
                  <div className="sm:hidden">
                    <AttachItem compact />
                  </div>
                  <SlashCommandsButton
                    showing={showSlashCommand}
                    setShowSlashCommand={setShowSlashCommand}
                    compact
                  />
                  <AvailableAgentsButton
                    showing={showAgents}
                    setShowing={setShowAgents}
                    compact
                  />
                  {/* Speech-to-Text Button - Show on mobile but smaller */}
                  <div className="p-1.5 sm:p-2 md:p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
                       style={{ minWidth: isFocused && window.innerWidth < 640 ? '32px' : '40px', minHeight: isFocused && window.innerWidth < 640 ? '32px' : '40px' }}>
                    <SpeechToText sendCommand={sendCommand} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowModeSelector(!showModeSelector)}
                    className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl transition-all touch-manipulation ${
                      responseMode === "agent"
                        ? "bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-600 dark:text-purple-400"
                        : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                    style={{ minWidth: '36px', minHeight: '36px' }}
                  >
                    {responseMode === "agent" ? (
                      <Brain className="w-4 h-4 sm:w-5 sm:h-5" weight="bold" />
                    ) : (
                      <Lightning className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
                
                {/* Enhanced textarea with improved mobile support */}
                <textarea
                  id={PROMPT_INPUT_ID}
                  ref={textareaRef}
                  onChange={handleChange}
                  onKeyDown={captureEnterOrUndo}
                  onPaste={(e) => {
                    saveCurrentState();
                    handlePasteEvent(e);
                  }}
                  required={true}
                  onFocus={() => {
                    setFocused(true);
                    // Expand input area on mobile when focused
                    if (window.innerWidth < 640 && formRef.current) {
                      formRef.current.style.position = 'relative';
                      formRef.current.style.zIndex = '100';
                    }
                  }}
                  onBlur={(e) => {
                    setFocused(false);
                    adjustTextArea(e);
                    // Reset mobile positioning
                    if (window.innerWidth < 640 && formRef.current) {
                      formRef.current.style.position = '';
                      formRef.current.style.zIndex = '';
                    }
                  }}
                  value={promptInput}
                  spellCheck={Appearance.get("enableSpellCheck")}
                  className="flex-1 border-none resize-none bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500/70 dark:placeholder:text-gray-400/70 text-[16px] leading-relaxed max-h-[100px] sm:max-h-[120px] md:max-h-[160px] focus:outline-none py-2 sm:py-3 md:py-4 px-1 sm:px-2 md:px-3 font-medium"
                  style={{ 
                    minHeight: '40px',
                    WebkitAppearance: 'none',
                    fontSize: '16px', // Prevents iOS zoom on focus
                    width: isFocused && window.innerWidth < 640 ? 'calc(100vw - 120px)' : 'auto'
                  }}
                  placeholder={responseMode === "agent" ? "Ask me anything with AI tools..." : "Ask me anything..."}
                />
                
                {/* Compact modern send button */}
                <div className="p-1 sm:p-1.5 md:p-2">
                  {isStreaming ? (
                    <StopGenerationButton />
                  ) : (
                    <>
                      <button
                        ref={formRef}
                        type="submit"
                        disabled={isDisabled || !promptInput.trim()}
                        className={`relative overflow-hidden rounded-xl sm:rounded-2xl transition-all transform active:scale-95 group touch-manipulation ${
                          !isDisabled && promptInput.trim() 
                            ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 hover:from-blue-600 hover:via-purple-600 hover:to-blue-700 cursor-pointer shadow-lg hover:shadow-xl md:hover:scale-105' 
                            : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                        }`}
                        style={{ 
                          minWidth: window.innerWidth < 640 ? '44px' : '48px', 
                          minHeight: window.innerWidth < 640 ? '44px' : '48px', 
                          padding: window.innerWidth < 640 ? '10px' : '12px',
                          WebkitTapHighlightColor: 'transparent',
                          zIndex: 10
                        }}
                        aria-label="Send message"
                      >
                        {!isDisabled && promptInput.trim() && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 animate-pulse opacity-50" />
                            <Sparkle className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 text-amber-300 animate-pulse z-10" />
                          </>
                        )}
                        <ArrowUp className="relative z-10 w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-sm" weight="bold" />
                      </button>
                      <Tooltip
                        id="send-prompt"
                        place="bottom"
                        delayShow={300}
                        className="tooltip !text-xs z-99"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Mode selector modal */}
          {showModeSelector && (
            <ResponseModeSelector
              responseMode={responseMode}
              setResponseMode={setResponseMode}
              showing={showModeSelector}
              setShowing={setShowModeSelector}
            />
          )}
        </div>
      </form>
    </div>
  );
}

/**
 * Handle event listeners to prevent the send button from being used
 * for whatever reason that may we may want to prevent the user from sending a message.
 */
function useIsDisabled() {
  const [isDisabled, setIsDisabled] = useState(false);

  /**
   * Handle attachments processing and processed events
   * to prevent the send button from being clicked when attachments are processing
   * or else the query may not have relevant context since RAG is not yet ready.
   */
  useEffect(() => {
    if (!window) return;
    window.addEventListener(ATTACHMENTS_PROCESSING_EVENT, () =>
      setIsDisabled(true)
    );
    window.addEventListener(ATTACHMENTS_PROCESSED_EVENT, () =>
      setIsDisabled(false)
    );

    return () => {
      window?.removeEventListener(ATTACHMENTS_PROCESSING_EVENT, () =>
        setIsDisabled(true)
      );
      window?.removeEventListener(ATTACHMENTS_PROCESSED_EVENT, () =>
        setIsDisabled(false)
      );
    };
  }, []);

  return { isDisabled };
}
