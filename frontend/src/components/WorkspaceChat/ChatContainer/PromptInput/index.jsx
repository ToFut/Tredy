import React, { useState, useRef, useEffect } from "react";
import SlashCommandsButton, {
  SlashCommands,
  useSlashCommands,
} from "./SlashCommands";
import debounce from "lodash.debounce";
import { PaperPlaneRight, Lightning, Sparkle, Brain, ArrowUp, GameController } from "@phosphor-icons/react";
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
import ActionButtonsBar from "./ActionButtonsBar";

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
  const [showGamifyTooltip, setShowGamifyTooltip] = useState(false);
  const [showGamifyMenu, setShowGamifyMenu] = useState(false);
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
    
    // Add appropriate @ prefix based on response mode
    // This needs to happen BEFORE the parent's submit handler reads the value
    let finalMessage = promptInput;
    
    if (responseMode === "agent" && !promptInput.startsWith("@agent")) {
      finalMessage = "@agent " + promptInput;
    } else if (responseMode === "flow" && !promptInput.startsWith("@flow")) {
      finalMessage = "@flow " + promptInput;
    }
    // chat mode doesn't need any prefix
    
    if (finalMessage !== promptInput) {
      textareaRef.current.value = finalMessage;
      setPromptInput(finalMessage);
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
        adjustTextArea({ target: textarea });
      }, 0);
    }
    return;
  }

  function handleChange(e) {
    setPromptInput(e.target.value); // Set state first
    debouncedSaveState(-1);
    onChange(e);
    watchForSlash(e);
    watchForAt(e);
    adjustTextArea(e);
  }

  function handleGamifyClick() {
    // Show gamify options menu
    setShowGamifyMenu(!showGamifyMenu);
  }

  function handleGamifyOption(option) {
    let prompt = "";
    
    switch(option) {
      case 'interactive':
        prompt = "Transform this conversation into an interactive learning experience with quizzes, challenges, and engaging elements.";
        break;
      case 'workflow':
        prompt = "@agent Create a workflow from this conversation that captures the key steps and processes we discussed.";
        // Also trigger workflow creation in FlowPanel
        triggerWorkflowCreation();
        break;
      case 'summary':
        prompt = "Create a gamified summary of our conversation with key insights, action items, and interactive elements.";
        break;
      case 'quiz':
        prompt = "Generate an interactive quiz based on the topics and information discussed in this conversation.";
        break;
    }

    setPromptInput(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
      adjustTextArea({ target: textareaRef.current });
    }
    setShowGamifyMenu(false);
  }

  function triggerWorkflowCreation() {
    // Trigger workflow creation in FlowPanel
    window.dispatchEvent(new CustomEvent('createWorkflowFromChat', {
      detail: {
        chatContext: promptInput,
        timestamp: new Date().toISOString()
      }
    }));
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
        <div className="flex items-center rounded-lg md:mb-4 md:w-full">
          <div className="w-[95vw] md:w-[635px] bg-theme-bg-chat-input light:bg-white light:border-solid light:border-[1px] light:border-theme-chat-input-border shadow-sm rounded-2xl flex flex-col px-2 overflow-hidden">
            <AttachmentManager attachments={attachments} />
            <div className="flex items-center border-b border-theme-chat-input-border mx-3">
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
                onFocus={() => setFocused(true)}
                onBlur={(e) => {
                  setFocused(false);
                  adjustTextArea(e);
                }}
                value={promptInput}
                spellCheck={Appearance.get("enableSpellCheck")}
                className={`border-none cursor-text max-h-[50vh] md:max-h-[350px] md:min-h-[40px] mx-2 md:mx-0 pt-[12px] w-full leading-5 md:text-md text-white bg-transparent placeholder:text-white/60 light:placeholder:text-theme-text-primary resize-none active:outline-none focus:outline-none flex-grow mb-1 ${textSizeClass}`}
                placeholder={t("chat_window.send_message")}
              />
              {isStreaming ? (
                <StopGenerationButton />
              ) : (
                <>
                  <button
                    ref={formRef}
                    type="submit"
                    disabled={isDisabled}
                    className="border-none inline-flex justify-center rounded-2xl cursor-pointer opacity-60 hover:opacity-100 light:opacity-100 light:hover:opacity-60 ml-4 disabled:cursor-not-allowed group"
                    data-tooltip-id="send-prompt"
                    data-tooltip-content={
                      isDisabled
                        ? t("chat_window.attachments_processing")
                        : t("chat_window.send")
                    }
                    aria-label={t("chat_window.send")}
                  >
                    <PaperPlaneRight
                      color="var(--theme-sidebar-footer-icon-fill)"
                      className="w-[22px] h-[22px] pointer-events-none text-theme-text-primary group-disabled:opacity-[25%]"
                      weight="fill"
                    />
                    <span className="sr-only">Send message</span>
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
            <div className="flex justify-between py-3.5 mx-3 mb-1">
              <div className="flex gap-x-2">
                <AttachItem />
                <SlashCommandsButton
                  showing={showSlashCommand}
                  setShowSlashCommand={setShowSlashCommand}
                />
                <AvailableAgentsButton
                  showing={showAgents}
                  setShowAgents={setShowAgents}
                />
                <TextSizeButton />
                <LLMSelectorAction />
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
                {/* Enhanced Action Buttons Bar */}
                <div className={`p-1.5 sm:p-2 md:p-3 transition-all duration-300 ${
                  isFocused && window.innerWidth < 640 && promptInput.length > 0 
                    ? 'scale-0 w-0 opacity-0 pointer-events-none' 
                    : ''
                }`}>
                  <ActionButtonsBar
                    sendCommand={sendCommand}
                    showSlashCommand={showSlashCommand}
                    setShowSlashCommand={setShowSlashCommand}
                    showAgents={showAgents}
                    setShowAgents={setShowAgents}
                    responseMode={responseMode}
                    setShowModeSelector={setShowModeSelector}
                    showModeSelector={showModeSelector}
                    isFocused={isFocused}
                    onGamifyClick={handleGamifyClick}
                    showGamifyMenu={showGamifyMenu}
                    onGamifyOption={handleGamifyOption}
                    compact={window.innerWidth < 640}
                  />
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
                  }}
                  onBlur={(e) => {
                    setFocused(false);
                    adjustTextArea(e);
                  }}
                  value={promptInput}
                  spellCheck={Appearance.get("enableSpellCheck")}
                  className={`flex-1 border-none resize-none bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500/70 dark:placeholder:text-gray-400/70 focus:outline-none font-medium transition-all ${
                    window.innerWidth < 640 
                      ? 'text-sm leading-tight py-2 px-2' // Mobile: smaller text
                      : 'text-[16px] leading-relaxed py-3 px-3' // Desktop: normal size
                  }`}
                  style={{ 
                    minHeight: window.innerWidth < 640 ? '36px' : '48px',
                    maxHeight: window.innerWidth < 640 && !isFocused ? '36px' : window.innerWidth < 640 ? '80px' : '160px',
                    WebkitAppearance: 'none',
                    fontSize: window.innerWidth < 640 ? '14px' : '16px', // Smaller on mobile
                  }}
                  placeholder={responseMode === "agent" ? "Ask AI..." : "Message..."}
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
