import React, { memo } from "react";
import { Info, Warning } from "@phosphor-icons/react";
import UserIcon from "../../../../UserIcon";
import Actions from "./Actions";
import renderMarkdown from "@/utils/chat/markdown";
import { userFromStorage } from "@/utils/request";
import Citations from "../Citation";
import { v4 } from "uuid";
import DOMPurify from "@/utils/chat/purify";
import { EditMessageForm, useEditMessage } from "./Actions/EditMessage";
import { useWatchDeleteMessage } from "./Actions/DeleteMessage";
import TTSMessage from "./Actions/TTSButton";
import {
  THOUGHT_REGEX_CLOSE,
  THOUGHT_REGEX_COMPLETE,
  THOUGHT_REGEX_OPEN,
  ThoughtChainComponent,
} from "../ThoughtContainer";
import paths from "@/utils/paths";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { chatQueryRefusalResponse } from "@/utils/chat";
import InteractiveConnectionButton from "../../../InteractiveConnectionButton";

const HistoricalMessage = ({
  uuid = v4(),
  message,
  role,
  workspace,
  sources = [],
  attachments = [],
  error = false,
  feedbackScore = null,
  chatId = null,
  isLastMessage = false,
  regenerateMessage,
  saveEditedMessage,
  forkThread,
  metrics = {},
  alignmentCls = "",
  username = null,
}) => {
  const { t } = useTranslation();
  const { isEditing } = useEditMessage({ chatId, role });
  const { isDeleted, completeDelete, onEndAnimation } = useWatchDeleteMessage({
    chatId,
    role,
  });
  const adjustTextArea = (event) => {
    const element = event.target;
    element.style.height = "auto";
    element.style.height = element.scrollHeight + "px";
  };

  const isRefusalMessage =
    role === "assistant" && message === chatQueryRefusalResponse(workspace);

  if (!!error) {
    return (
      <div
        key={uuid}
        className={`flex justify-center items-end w-full bg-theme-bg-chat`}
      >
        <div className="py-8 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col">
          <div className={`flex gap-x-5 ${alignmentCls}`}>
            <ProfileImage role={role} workspace={workspace} username={username} />
            <div className="p-2 rounded-lg bg-red-50 text-red-500">
              <span className="inline-block">
                <Warning className="h-4 w-4 mb-1 inline-block" /> Could not
                respond to message.
              </span>
              <p className="text-xs font-mono mt-2 border-l-2 border-red-300 pl-2 bg-red-200 p-2 rounded-sm">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (completeDelete) return null;

  return (
    <div
      key={uuid}
      onAnimationEnd={onEndAnimation}
      className={`${
        isDeleted ? "animate-remove" : ""
      } flex justify-center w-full group hover:bg-gradient-to-r hover:from-gray-50/30 hover:to-transparent transition-all duration-300`}
    >
      <div className="w-full max-w-4xl mx-auto px-6 py-6">
        <div className="flex gap-x-5">
          <div className="flex flex-col items-center">
            <ProfileImage role={role} workspace={workspace} username={username} />
            <div className="mt-1 -mb-10">
              {role === "assistant" && (
                <TTSMessage
                  slug={workspace?.slug}
                  chatId={chatId}
                  message={message}
                />
              )}
            </div>
          </div>
          {isEditing ? (
            <EditMessageForm
              role={role}
              chatId={chatId}
              message={message}
              attachments={attachments}
              adjustTextArea={adjustTextArea}
              saveChanges={saveEditedMessage}
            />
          ) : (
            <div className="flex-1 min-w-0">
              <div className="text-[15px] leading-[1.7] text-gray-900 whitespace-pre-wrap font-medium">
                <RenderChatContent
                  role={role}
                  message={message}
                  expanded={isLastMessage}
                  workspace={workspace}
                />
              </div>
              {isRefusalMessage && (
                <Link
                  data-tooltip-id="query-refusal-info"
                  data-tooltip-content={`${t("chat.refusal.tooltip-description")}`}
                  className="!no-underline group !flex w-fit mt-3"
                  to={paths.chatModes()}
                  target="_blank"
                >
                  <div className="flex flex-row items-center gap-x-1 group-hover:opacity-100 opacity-60 w-fit">
                    <Info className="text-theme-text-secondary" />
                    <p className="!m-0 !p-0 !no-underline text-xs cursor-pointer text-theme-text-secondary">
                      {t("chat.refusal.tooltip-title")}
                    </p>
                  </div>
                </Link>
              )}
              <ChatAttachments attachments={attachments} />
            </div>
          )}
        </div>
        {/* Enhanced Actions - Modern style */}
        {role === "assistant" && (
          <div className="mt-3 ml-[50px] opacity-0 group-hover:opacity-100 transition-all duration-200">
            <div className="flex items-center gap-x-2">
              <button 
                onClick={() => navigator.clipboard.writeText(message)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-center gap-x-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy
              </button>
              {isLastMessage && (
                <button 
                  onClick={() => regenerateMessage()}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-center gap-x-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </button>
              )}
            </div>
          </div>
        )}
        {role === "assistant" && sources?.length > 0 && (
          <div className="mt-3 ml-[46px]">
            <Citations sources={sources} />
          </div>
        )}
      </div>
    </div>
  );
};

function ProfileImage({ role, workspace, username }) {
  if (role === "assistant" && workspace.pfpUrl) {
    return (
      <div className="flex-shrink-0">
        <div className="relative w-[30px] h-[30px] rounded-full overflow-hidden bg-black flex items-center justify-center">
          {workspace.pfpUrl ? (
            <img
              src={workspace.pfpUrl}
              alt="AI Assistant"
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-xs font-medium">AI</span>
          )}
        </div>
      </div>
    );
  }

  // For user messages, show the username if available
  const displayName = role === "user" && username ? username : (role === "user" ? userFromStorage()?.username : workspace.slug);
  
  return (
    <div className="flex-shrink-0">
      <div className={`relative w-[38px] h-[38px] rounded-xl flex items-center justify-center shadow-lg transform transition-all duration-200 hover:scale-105 ${
        role === "user" 
          ? "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" 
          : "bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
      }`}>
        <span className="text-white text-sm font-bold drop-shadow-sm">
          {role === "user" ? (displayName?.charAt(0)?.toUpperCase() || "U") : "AI"}
        </span>
        {role === "assistant" && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse" />
        )}
      </div>
    </div>
  );
}

export default memo(
  HistoricalMessage,
  // Skip re-render the historical message:
  // if the content is the exact same AND (not streaming)
  // the lastMessage status is the same (regen icon)
  // and the chatID matches between renders. (feedback icons)
  (prevProps, nextProps) => {
    return (
      prevProps.message === nextProps.message &&
      prevProps.isLastMessage === nextProps.isLastMessage &&
      prevProps.chatId === nextProps.chatId
    );
  }
);

function ChatAttachments({ attachments = [] }) {
  if (!attachments.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((item) => (
        <img
          key={item.name}
          src={item.contentString}
          className="max-w-[300px] rounded-md"
        />
      ))}
    </div>
  );
}

const RenderChatContent = memo(
  ({ role, message, expanded = false, workspace }) => {
    // Process OAuth connection patterns
    const processConnectionPatterns = (text) => {
      // Pattern: [connect:provider]
      const connectionPattern = /\[connect:([^\]]+)\]/g;
      let processedText = text;
      const connections = [];
      
      let match;
      while ((match = connectionPattern.exec(text)) !== null) {
        const provider = match[1];
        const buttonId = `oauth-btn-${provider}-${Math.random().toString(36).substr(2, 9)}`;
        connections.push({ provider, buttonId });
        
        // Replace pattern with placeholder div
        processedText = processedText.replace(
          match[0], 
          `<div id="${buttonId}" class="oauth-connection-placeholder"></div>`
        );
      }
      
      return { processedText, connections };
    };

    // If the message is not from the assistant, we can render it directly
    // as normal since the user cannot think (lol)
    if (role !== "assistant")
      return (
        <span
          className="flex flex-col gap-y-1"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(renderMarkdown(message)),
          }}
        />
      );
    let thoughtChain = null;
    let msgToRender = message;

    // If the message is a perfect thought chain, we can render it directly
    // Complete == open and close tags match perfectly.
    if (message.match(THOUGHT_REGEX_COMPLETE)) {
      thoughtChain = message.match(THOUGHT_REGEX_COMPLETE)?.[0];
      msgToRender = message.replace(THOUGHT_REGEX_COMPLETE, "");
    }

    // If the message is a thought chain but not a complete thought chain (matching opening tags but not closing tags),
    // we can render it as a thought chain if we can at least find a closing tag
    // This can occur when the assistant starts with <thinking> and then <response>'s later.
    if (
      message.match(THOUGHT_REGEX_OPEN) &&
      message.match(THOUGHT_REGEX_CLOSE)
    ) {
      const closingTag = message.match(THOUGHT_REGEX_CLOSE)?.[0];
      const splitMessage = message.split(closingTag);
      thoughtChain = splitMessage[0] + closingTag;
      msgToRender = splitMessage[1];
    }

    // Process connection patterns
    const { processedText, connections } = processConnectionPatterns(msgToRender);

    return (
      <>
        {thoughtChain && (
          <ThoughtChainComponent content={thoughtChain} expanded={expanded} />
        )}
        <span
          className="flex flex-col gap-y-1"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(renderMarkdown(processedText)),
          }}
        />
        {connections.map(({ provider, buttonId }) => (
          <InteractiveConnectionButton
            key={buttonId}
            provider={provider}
            workspace={workspace}
            placeholderId={buttonId}
          />
        ))}
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.role === nextProps.role &&
      prevProps.message === nextProps.message &&
      prevProps.expanded === nextProps.expanded
    );
  }
);
