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

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((force = false) => {
    if (!chatHistoryRef.current) return;
    
    const now = Date.now();
    const timeSinceLastScroll = now - lastScrollTime.current;
    
    // Don't interrupt recent user scrolling unless forced
    if (!force && timeSinceLastScroll < 100) return;
    
    const element = chatHistoryRef.current;
    const isAtBottom = checkIsAtBottom();
    
    // Only auto-scroll if user is already near bottom or during streaming
    if (force || isAtBottom || isStreaming) {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: isStreaming ? 'auto' : 'smooth'
      });
      setIsUserScrolling(false);
    }
  }, [checkIsAtBottom, isStreaming]);

  // Auto-scroll on new messages
  useEffect(() => {
    const shouldAutoScroll = isStreaming || hasStatusResponse || (!isUserScrolling && isAtBottom);
    
    if (shouldAutoScroll) {
      // Small delay to ensure DOM is updated
      setTimeout(() => scrollToBottom(isStreaming), 16);
    }
  }, [history, isStreaming, hasStatusResponse, isUserScrolling, isAtBottom, scrollToBottom]);

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
      <div className="flex-1 flex flex-col md:mt-0 w-full justify-center items-center bg-gray-50 dark:bg-gray-900 overflow-y-auto">
        <div className="flex h-full flex-col items-center justify-center px-6 max-w-2xl">
          {/* Simple welcome logo */}
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
            <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          {/* Clean heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {workspace?.name ? `Welcome to ${workspace.name}` : "Start a Conversation"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Ask me anything about your workspace documents and data.
            </p>
          </div>
          
          {/* Simple suggestions if available */}
          <WorkspaceChatSuggestions
            suggestions={workspace?.suggestedMessages || []}
            sendSuggestion={handleSendSuggestedMessage}
          />
          
          {/* Setup guidance */}
          {(!workspace?.documents || workspace.documents.length === 0) && (
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                No documents connected yet.
              </p>
              <button
                onClick={showModal}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
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
      className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-h-0"
      id="chat-container"
    >
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ 
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
        id="chat-history"
        ref={chatHistoryRef}
      >
          <div className="px-4 py-2 pb-4">
          {compiledHistory.map((item, index) =>
            Array.isArray(item) ? renderStatusResponse(item, index) : item
          )}
          {showing && (
            <ManageWorkspace hideModal={hideModal} providedSlug={workspace.slug} />
          )}
        </div>
      </div>
      {!isAtBottom && (
        <div className="absolute bottom-4 right-4 md:right-8 z-50 cursor-pointer">
          <button
            onClick={manualScrollToBottom}
            className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowDown className="w-5 h-5" weight="bold" />
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