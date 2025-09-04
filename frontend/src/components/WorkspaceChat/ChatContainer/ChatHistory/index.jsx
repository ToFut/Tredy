import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import HistoricalMessage from "./HistoricalMessage";
import PromptReply from "./PromptReply";
import StatusResponse from "./StatusResponse";
import { useManageWorkspaceModal } from "../../../Modals/ManageWorkspace";
import ManageWorkspace from "../../../Modals/ManageWorkspace";
import { ArrowDown, Brain, Sparkle, Lightning, ChatsCircle } from "@phosphor-icons/react";
import debounce from "lodash.debounce";
import useUser from "@/hooks/useUser";
import Chartable from "./Chartable";
import Workspace from "@/models/workspace";
import { useParams } from "react-router-dom";
import paths from "@/utils/paths";
import Appearance from "@/models/appearance";
import useTextSize from "@/hooks/useTextSize";
import { v4 } from "uuid";
import { useTranslation } from "react-i18next";
import { useChatMessageAlignment } from "@/hooks/useChatMessageAlignment";

export default function ChatHistory({
  history = [],
  workspace,
  sendCommand,
  updateHistory,
  regenerateAssistantMessage,
  hasAttachments = false,
}) {
  const { t } = useTranslation();
  const lastScrollTopRef = useRef(0);
  const { user } = useUser();
  const { threadSlug = null } = useParams();
  const { showing, showModal, hideModal } = useManageWorkspaceModal();
  const [isAtBottom, setIsAtBottom] = useState(true);
  const chatHistoryRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const isStreaming = history[history.length - 1]?.animate;
  const hasStatusResponse = history[history.length - 1]?.type === "statusResponse";
  const { showScrollbar } = Appearance.getSettings();
  const { textSizeClass } = useTextSize();
  const { getMessageAlignment } = useChatMessageAlignment();

  // Simplified scroll state management
  const scrollTimeoutRef = useRef(null);
  const lastScrollTime = useRef(0);

  // Check if user is at bottom
  const checkIsAtBottom = useCallback(() => {
    if (!chatHistoryRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = chatHistoryRef.current;
    return scrollHeight - scrollTop - clientHeight <= 5; // Tighter tolerance
  }, []);

  // Enhanced scroll to bottom with guaranteed visibility
  const scrollToBottom = useCallback((force = false) => {
    if (!chatHistoryRef.current) return;
    
    const element = chatHistoryRef.current;
    
    // Always scroll to bottom for new messages
    requestAnimationFrame(() => {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: force ? 'auto' : 'smooth'
      });
      
      // Double-check scroll position after a brief delay
      setTimeout(() => {
        if (!checkIsAtBottom()) {
          element.scrollTo({
            top: element.scrollHeight,
            behavior: 'auto'
          });
        }
      }, 100);
      
      setIsUserScrolling(false);
    });
  }, [checkIsAtBottom]);

  // Always ensure last message is visible
  useEffect(() => {
    // Immediately scroll to bottom when new messages arrive
    if (history.length > 0) {
      scrollToBottom(true); // Force scroll to show new messages
    }
  }, [history]);

  // Handle streaming updates
  useEffect(() => {
    if (isStreaming || hasStatusResponse) {
      scrollToBottom(true);
    }
  }, [isStreaming, hasStatusResponse]);

  // Unified scroll handler with passive listening
  const handleScroll = useCallback(() => {
    if (!chatHistoryRef.current) return;
    
    lastScrollTime.current = Date.now();
    const isAtBottom = checkIsAtBottom();
    
    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Update states immediately for responsive UI
    setIsAtBottom(isAtBottom);
    
    // Set user scrolling state with delay to avoid flickering
    if (!isAtBottom) {
      setIsUserScrolling(true);
      
      // Reset user scrolling state after user stops scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        if (checkIsAtBottom()) {
          setIsUserScrolling(false);
        }
      }, 150);
    } else {
      setIsUserScrolling(false);
    }
  }, [checkIsAtBottom]);

  useEffect(() => {
    const element = chatHistoryRef.current;
    if (!element) return;

    // Use passive listener for better performance
    element.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      element.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // Manual scroll to bottom for button click
  const manualScrollToBottom = useCallback(() => {
    scrollToBottom(true);
  }, [scrollToBottom]);

  const handleSendSuggestedMessage = (heading, message) => {
    sendCommand({ text: `${heading} ${message}`, autoSubmit: true });
  };

  const saveEditedMessage = async ({
    editedMessage,
    chatId,
    role,
    attachments = [],
  }) => {
    if (!editedMessage) return; // Don't save empty edits.

    const updatedHistory = history.map((h) => {
      if (h.chatId === chatId) {
        return { ...h, content: editedMessage };
      }
      return h;
    });

    updateHistory(updatedHistory);
  };

  const forkThread = async ({ chatId, role }) => {
    const chatIndex = history.findIndex((chat) => chat.chatId === chatId);
    if (chatIndex === -1) return false;

    // Remove all messages after this one
    const updatedHistory = history.slice(0, chatIndex + 1);
    const newThreadId = v4();

    const newThreadSlug = await Workspace.threads.new({
      workspaceSlug: workspace.slug,
      threadId: newThreadId,
      history: updatedHistory,
    });

    if (!newThreadSlug) return false;

    window.location.href = paths.workspace.thread(
      workspace.slug,
      newThreadSlug
    );
  };

  const compiledHistory = useMemo(
    () =>
      buildMessages({
        workspace,
        history,
        regenerateAssistantMessage,
        saveEditedMessage,
        forkThread,
        getMessageAlignment,
      }),
    [
      workspace,
      history,
      regenerateAssistantMessage,
      saveEditedMessage,
      forkThread,
    ]
  );
  const lastMessageInfo = useMemo(() => getLastMessageInfo(history), [history]);
  const renderStatusResponse = useCallback(
    (item, index) => {
      const hasSubsequentMessages = index < compiledHistory.length - 1;
      return (
        <StatusResponse
          key={`status-group-${index}`}
          messages={item}
          isThinking={!hasSubsequentMessages && lastMessageInfo.isAnimating}
          showCheckmark={
            hasSubsequentMessages ||
            (!lastMessageInfo.isAnimating && !lastMessageInfo.isStatusResponse)
          }
        />
      );
    },
    [compiledHistory.length, lastMessageInfo]
  );

  if (history.length === 0 && !hasAttachments) {
    return (
      <div className="flex-1 flex flex-col w-full justify-center items-center bg-gray-50 dark:bg-gray-900 overflow-y-auto safe-area-inset">
        <div className="flex h-full flex-col items-center justify-center px-4 sm:px-6 max-w-2xl mx-auto">
          {/* Mobile-optimized welcome logo */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
            <Brain className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          {/* Mobile-responsive heading */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
              {workspace?.name ? `Welcome to ${workspace.name}` : "Start a Conversation"}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-2">
              Ask me anything about your workspace documents and data.
            </p>
          </div>
          
          {/* Simple suggestions if available */}
          <WorkspaceChatSuggestions
            suggestions={workspace?.suggestedMessages || []}
            sendSuggestion={handleSendSuggestedMessage}
          />
          
          {/* Mobile-optimized setup guidance */}
          {(!workspace?.documents || workspace.documents.length === 0) && (
            <div className="mt-6 sm:mt-8 p-4 sm:p-5 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800 mx-4 sm:mx-0">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3 text-center">
                No documents connected yet.
              </p>
              <button
                onClick={showModal}
                className="w-full sm:w-auto text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium text-center block"
              >
                Add documents to get started →
              </button>
            </div>
          )}
          
          {showing && (
            <ManageWorkspace
              hideModal={hideModal}
              providedSlug={workspace.slug}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-h-0 safe-area-inset"
      id="chat-container"
    >
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ 
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          // Better mobile scroll performance
          transform: 'translate3d(0,0,0)',
          WebkitTransform: 'translate3d(0,0,0)'
        }}
        id="chat-history"
        ref={chatHistoryRef}
      >
          <div className="px-2 sm:px-4 py-2 pb-4 sm:pb-6">
          {compiledHistory.map((item, index) =>
            Array.isArray(item) ? renderStatusResponse(item, index) : item
          )}
          {showing && (
            <ManageWorkspace hideModal={hideModal} providedSlug={workspace.slug} />
          )}
        </div>
      </div>
      {!isAtBottom && (
        <div className="absolute bottom-2 right-2 sm:right-4 md:right-8 z-50 cursor-pointer">
          <button
            onClick={manualScrollToBottom}
            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 active:scale-95 touch-manipulation"
            style={{ minWidth: '40px', minHeight: '40px' }}
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4 sm:w-6 sm:h-6" weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}

const getLastMessageInfo = (history) => {
  const lastMessage = history?.[history.length - 1] || {};
  return {
    isAnimating: lastMessage?.animate,
    isStatusResponse: lastMessage?.type === "statusResponse",
  };
};

function WorkspaceChatSuggestions({ suggestions = [], sendSuggestion }) {
  if (suggestions.length === 0) return null;
  
  const icons = [Lightning, Brain, Sparkle, ChatsCircle];
  
  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Try these suggestions:
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((suggestion, index) => {
          const Icon = icons[index % icons.length];
          return (
            <button
              key={index}
              className="text-left p-4 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
              onClick={() => sendSuggestion(suggestion.heading, suggestion.message)}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white mb-1">
                    {suggestion.heading}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {suggestion.message}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Builds the history of messages for the chat.
 */
function buildMessages({
  history,
  workspace,
  regenerateAssistantMessage,
  saveEditedMessage,
  forkThread,
  getMessageAlignment,
}) {
  return history.reduce((acc, props, index) => {
    const isLastBotReply =
      index === history.length - 1 && props.role === "assistant";

    if (props?.type === "statusResponse" && !!props.content) {
      if (acc.length > 0 && Array.isArray(acc[acc.length - 1])) {
        acc[acc.length - 1].push(props);
      } else {
        acc.push([props]);
      }
      return acc;
    }

    if (props.type === "rechartVisualize" && !!props.content) {
      acc.push(
        <Chartable key={props.uuid} workspace={workspace} props={props} />
      );
    } else if (isLastBotReply && props.animate) {
      acc.push(
        <PromptReply
          key={props.uuid || v4()}
          uuid={props.uuid}
          reply={props.content}
          pending={props.pending}
          sources={props.sources}
          error={props.error}
          workspace={workspace}
          closed={props.closed}
        />
      );
    } else {
      acc.push(
        <HistoricalMessage
          key={index}
          message={props.content}
          role={props.role}
          workspace={workspace}
          sources={props.sources}
          feedbackScore={props.feedbackScore}
          chatId={props.chatId}
          error={props.error}
          attachments={props.attachments}
          regenerateMessage={regenerateAssistantMessage}
          isLastMessage={isLastBotReply}
          saveEditedMessage={saveEditedMessage}
          forkThread={forkThread}
          metrics={props.metrics}
          alignmentCls={getMessageAlignment?.(props.role)}
          username={props.username}
        />
      );
    }
    return acc;
  }, []);
}