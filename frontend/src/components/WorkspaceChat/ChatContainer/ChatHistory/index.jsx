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
  const { showScrollbar } = Appearance.getSettings();
  const { textSizeClass } = useTextSize();
  const { getMessageAlignment } = useChatMessageAlignment();

  useEffect(() => {
    // Always scroll to bottom when streaming or when new messages arrive and we're near bottom
    if (isStreaming || (!isUserScrolling && isAtBottom)) {
      scrollToBottom(false);
    }
    // Force scroll to bottom when history changes and we're not streaming
    else if (history.length > 0 && !isStreaming && !isUserScrolling) {
      scrollToBottom(true);
    }
  }, [history, isAtBottom, isStreaming, isUserScrolling]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Consider "near bottom" if within 100px of the bottom
    const isNearBottom = scrollHeight - scrollTop - clientHeight <= 100;
    
    // Only consider user scrolling if they've moved more than 100px from bottom
    if (Math.abs(scrollTop - lastScrollTopRef.current) > 10) {
      setIsUserScrolling(!isNearBottom);
    }

    setIsAtBottom(isNearBottom);
    lastScrollTopRef.current = scrollTop;
  };

  const debouncedScroll = debounce(handleScroll, 100);

  useEffect(() => {
    const chatHistoryElement = chatHistoryRef.current;
    if (chatHistoryElement) {
      chatHistoryElement.addEventListener("scroll", debouncedScroll);
      return () =>
        chatHistoryElement.removeEventListener("scroll", debouncedScroll);
    }
  }, []);

  const scrollToBottom = (smooth = false) => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTo({
        top: chatHistoryRef.current.scrollHeight,

        // Smooth is on when user clicks the button but disabled during auto scroll
        // We must disable this during auto scroll because it causes issues with
        // detecting when we are at the bottom of the chat.
        ...(smooth ? { behavior: "smooth" } : {}),
      });
    }
  };

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

    // if the edit was a user message, we will auto-regenerate the response and delete all
    // messages post modified message
    if (role === "user") {
      // remove all messages after the edited message
      // technically there are two chatIds per-message pair, this will split the first.
      const updatedHistory = history.slice(
        0,
        history.findIndex((msg) => msg.chatId === chatId) + 1
      );

      // update last message in history to edited message
      updatedHistory[updatedHistory.length - 1].content = editedMessage;
      // remove all edited messages after the edited message in backend
      await Workspace.deleteEditedChats(workspace.slug, threadSlug, chatId);
      sendCommand({
        text: editedMessage,
        autoSubmit: true,
        history: updatedHistory,
        attachments,
      });
      return;
    }

    // If role is an assistant we simply want to update the comment and save on the backend as an edit.
    if (role === "assistant") {
      const updatedHistory = [...history];
      const targetIdx = history.findIndex(
        (msg) => msg.chatId === chatId && msg.role === role
      );
      if (targetIdx < 0) return;
      updatedHistory[targetIdx].content = editedMessage;
      updateHistory(updatedHistory);
      await Workspace.updateChatResponse(
        workspace.slug,
        threadSlug,
        chatId,
        editedMessage
      );
      return;
    }
  };

  const forkThread = async (chatId) => {
    const newThreadSlug = await Workspace.forkThread(
      workspace.slug,
      threadSlug,
      chatId
    );
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
      <div className="flex flex-col h-full md:mt-0 pb-44 md:pb-40 w-full justify-center items-center bg-gradient-to-br from-gray-50/50 via-white to-gray-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="flex h-full flex-col items-center justify-center px-6 max-w-4xl">
          {/* Modern animated logo */}
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 rounded-3xl blur-3xl opacity-20 animate-pulse group-hover:opacity-30 transition-opacity" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 hover:rotate-3 transition-all duration-300 backdrop-blur-sm border border-white/20">
              <Brain className="w-12 h-12 text-white drop-shadow-lg" weight="bold" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                <Sparkle className="w-4 h-4 text-white" weight="bold" />
              </div>
            </div>
          </div>
          
          {/* Modern heading with gradient */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
              {workspace?.slug !== "home" ? "Ready to help you" : "Welcome to Tredy AI"}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
              {workspace?.slug !== "home"
                ? "Ask me anything, explore ideas, and get insights powered by advanced AI"
                : "Your intelligent AI workspace for conversations, research, and analysis"}
            </p>
          </div>
          
          {/* Modern feature highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 w-full max-w-3xl">
            <div className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:border-purple-300/50 dark:hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Lightning className="w-6 h-6 text-white" weight="bold" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Lightning Fast</span>
            </div>
            <div className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:border-blue-300/50 dark:hover:border-blue-500/50 transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-white" weight="bold" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Powered</span>
            </div>
            <div className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:border-green-300/50 dark:hover:border-green-500/50 transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ChatsCircle className="w-6 h-6 text-white" weight="bold" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Interactive</span>
            </div>
            <div className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:border-amber-300/50 dark:hover:border-amber-500/50 transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkle className="w-6 h-6 text-white" weight="bold" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Creative</span>
            </div>
          </div>
        </div>
        
        {/* Enhanced suggestions */}
        <div className="flex flex-col items-center md:items-start md:max-w-[700px] w-full px-4 mt-auto">
          <WorkspaceChatSuggestions
            suggestions={workspace?.suggestedMessages ?? []}
            sendSuggestion={handleSendSuggestedMessage}
          />
        </div>
        
        {showing && (
          <ManageWorkspace
            hideModal={hideModal}
            providedSlug={workspace.slug}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-y-auto pb-32 bg-white"
      style={{ scrollBehavior: isStreaming ? 'auto' : 'smooth' }}
      id="chat-history"
      ref={chatHistoryRef}
      onScroll={handleScroll}
    >
      {compiledHistory.map((item, index) =>
        Array.isArray(item) ? renderStatusResponse(item, index) : item
      )}
      {showing && (
        <ManageWorkspace hideModal={hideModal} providedSlug={workspace.slug} />
      )}
      {!isAtBottom && (
        <div className="fixed bottom-40 right-10 md:right-20 z-50 cursor-pointer animate-pulse">
          <div className="flex flex-col items-center">
            <div
              className="p-1 rounded-full border border-white/10 bg-white/10 hover:bg-white/20 hover:text-white"
              onClick={() => {
                scrollToBottom(true);
                setIsUserScrolling(false);
              }}
            >
              <ArrowDown weight="bold" className="text-white/60 w-5 h-5" />
            </div>
          </div>
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
    <div className="w-full">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent flex-1" />
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3">Quick Start</p>
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent flex-1" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
        {suggestions.map((suggestion, index) => {
          const Icon = icons[index % icons.length];
          return (
            <button
              key={index}
              className="relative text-left p-4 rounded-xl bg-white dark:bg-gray-800 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg transition-all group transform hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => sendSuggestion(suggestion.heading, suggestion.message)}
            >
              <div className="absolute -top-2 -left-2 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <Icon className="w-4 h-4 text-white" weight="bold" />
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 group-hover:from-purple-100 group-hover:to-pink-100 dark:group-hover:from-purple-900/30 dark:group-hover:to-pink-900/30 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors mb-1">
                    {suggestion.heading}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{suggestion.message}</p>
                </div>
              </div>
              <Sparkle className="absolute bottom-2 right-2 w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Builds the history of messages for the chat.
 * This is mostly useful for rendering the history in a way that is easy to understand.
 * as well as compensating for agent thinking and other messages that are not part of the history, but
 * are still part of the chat.
 *
 * @param {Object} param0 - The parameters for building the messages.
 * @param {Array} param0.history - The history of messages.
 * @param {Object} param0.workspace - The workspace object.
 * @param {Function} param0.regenerateAssistantMessage - The function to regenerate the assistant message.
 * @param {Function} param0.saveEditedMessage - The function to save the edited message.
 * @param {Function} param0.forkThread - The function to fork the thread.
 * @param {Function} param0.getMessageAlignment - The function to get the alignment of the message (returns class).
 * @returns {Array} The compiled history of messages.
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
