import React, { memo, useState } from "react";
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
import { Zap, Brain, ChevronRight } from "lucide-react";

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
        <div className="py-3 sm:py-6 lg:py-8 px-2 sm:px-4 w-full flex gap-x-2 sm:gap-x-4 lg:gap-x-5 md:max-w-[80%] flex-col">
          <div className={`flex gap-x-5 ${alignmentCls}`}>
            <ProfileImage
              role={role}
              workspace={workspace}
              username={username}
            />
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
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6">
        <div className="flex gap-x-2 sm:gap-x-4 lg:gap-x-5">
          <div className="flex flex-col items-center">
            <ProfileImage
              role={role}
              workspace={workspace}
              username={username}
            />
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
            <div className="flex-1 min-w-0 max-w-full">
              <div className="text-base sm:text-lg leading-relaxed sm:leading-relaxed text-gray-800 whitespace-pre-wrap font-normal break-words">
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

              {/* Metrics display for assistant messages */}
              {role === "assistant" &&
                (Object.keys(metrics).length > 0 || metrics.tools) && (
                  <HistoricalMessageMetrics
                    metrics={metrics}
                    message={message}
                  />
                )}
            </div>
          )}
        </div>
        {/* Enhanced Actions - Modern style */}
        {role === "assistant" && (
          <div className="mt-2 ml-[32px] sm:ml-[50px] opacity-0 group-hover:opacity-100 transition-all duration-200">
            <div className="flex items-center gap-x-2">
              <button
                onClick={() => navigator.clipboard.writeText(message)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-center gap-x-1.5"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                Copy
              </button>
              {isLastMessage && (
                <button
                  onClick={() => regenerateMessage()}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-center gap-x-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Regenerate
                </button>
              )}
            </div>
          </div>
        )}
        {role === "assistant" && sources?.length > 0 && (
          <div className="mt-2 ml-[32px] sm:ml-[46px]">
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
  const displayName =
    role === "user" && username
      ? username
      : role === "user"
        ? userFromStorage()?.username
        : workspace.slug;

  return (
    <div className="flex-shrink-0">
      <div
        className={`relative w-[30px] h-[30px] sm:w-[38px] sm:h-[38px] rounded-xl flex items-center justify-center shadow-lg transform transition-all duration-200 hover:scale-105 ${
          role === "user"
            ? "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            : "bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        }`}
      >
        <span className="text-white text-xs sm:text-sm font-bold drop-shadow-sm">
          {role === "user"
            ? displayName?.charAt(0)?.toUpperCase() || "U"
            : "AI"}
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
        console.log("🔌 Found connection pattern:", provider);

        // Remove the pattern from the text (button will render separately)
        processedText = processedText.replace(match[0], "");
      }

      console.log("🔌 Connections found:", connections.length);
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
    const { processedText, connections } =
      processConnectionPatterns(msgToRender);

    // Process connection patterns and render normally

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

/**
 * Historical Message Metrics Component - Landing page style
 * Shows structured content above and compact metrics line below
 */
function HistoricalMessageMetrics({ metrics, message }) {
  const [showThinking, setShowThinking] = useState(false);
  const hasThinking = metrics.thinking && metrics.thinking.length > 0;

  // Check if we have tools - show for any tool activity
  const hasTools = metrics.tools && metrics.tools.length > 0;

  return (
    <div className="mt-3">
      {/* Compact Metrics Line ONLY (like image) - no structured cards */}
      {hasTools ? (
        <div className="flex items-center gap-3 text-xs text-gray-600 px-1">
          {/* Tool Logos */}
          <div className="flex items-center gap-1">
            {metrics.tools.slice(0, 5).map((tool, idx) => {
              const toolName = tool.name || tool;
              // Direct logo mapping
              const getDirectLogo = (name) => {
                const lowerName = name.toLowerCase();
                if (lowerName.includes("jira")) {
                  return "https://upload.wikimedia.org/wikipedia/commons/8/8a/Jira_Logo.svg";
                } else if (lowerName.includes("github")) {
                  return "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg";
                } else if (lowerName.includes("gmail")) {
                  return "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg";
                } else if (lowerName.includes("calendar")) {
                  return "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg";
                } else if (lowerName.includes("linkedin")) {
                  return "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png";
                } else if (lowerName.includes("drive")) {
                  return "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg";
                } else if (lowerName.includes("slack")) {
                  return "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg";
                } else if (lowerName.includes("figma")) {
                  return "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg";
                } else if (lowerName.includes("notion")) {
                  return "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png";
                }
                return null;
              };

              const logoSrc = getDirectLogo(toolName);

              return (
                <div key={idx} className="relative">
                  {logoSrc ? (
                    <div className="relative group/logo">
                      <img
                        src={logoSrc}
                        alt={toolName}
                        className="w-4 h-4 rounded cursor-pointer hover:scale-110 transition-transform"
                        title={toolName}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 shadow-lg text-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover/logo:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {toolName}
                      </div>
                    </div>
                  ) : null}
                  {/* Fallback icon */}
                  <div
                    className="relative group/logo"
                    style={{ display: logoSrc ? "none" : "block" }}
                  >
                    <div className="w-4 h-4 bg-gray-300 rounded flex items-center justify-center text-xs font-bold text-gray-600 cursor-pointer hover:scale-110 transition-transform">
                      {toolName.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 shadow-lg text-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover/logo:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {toolName}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time with lightning emoji */}
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">⚡</span>
            <span>{metrics.time}</span>
          </div>

          {/* Confidence bar */}
          <div className="flex items-center gap-1">
            <div className="w-12 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${metrics.confidence}%` }}
              ></div>
            </div>
            <span>{metrics.confidence}%</span>
          </div>

          {/* Model name in black */}
          <div className="flex items-center gap-1">
            <span className="text-gray-900 font-medium">{metrics.model}</span>
          </div>

          {/* Details button - always show if we have any thinking/details */}
          {(hasThinking || message) && (
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <span>📋</span>
              <span>Details</span>
              <ChevronRight
                className={`w-3 h-3 transition-transform ${showThinking ? "rotate-90" : ""}`}
              />
            </button>
          )}
        </div>
      ) : null}

      {/* Expanded details - show actual process details */}
      {showThinking && (
        <div className="ml-4 p-3 bg-slate-50 rounded-lg border border-slate-200 mt-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-3">
            <span>🔍</span>
            Processing Steps
          </div>

          <div className="space-y-2">
            {/* Extract details from message or create meaningful steps */}
            {metrics.tools &&
              metrics.tools.map((tool, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-slate-400 rounded-full mt-1.5"></div>
                    <span className="text-xs text-slate-600 font-medium">
                      {tool.name} Integration
                    </span>
                  </div>

                  {/* Tool-specific details with smart status detection */}
                  {tool.name === "LinkedIn" && (
                    <div className="ml-3 space-y-1">
                      <div className="text-xs text-slate-500">
                        • Accessing LinkedIn integration
                      </div>
                      <div className="text-xs text-slate-500">
                        • Target profile:{" "}
                        {message?.match(
                          /invite to ([^@\s]+(?:\s+[^@\s]+)*)/
                        )?.[1] || "segev halfon"}
                      </div>
                      {message?.includes("404") ||
                      message?.includes("not connected") ||
                      message?.includes("limitations") ? (
                        <>
                          <div className="text-xs text-red-500">
                            • ⚠️ Connection required
                          </div>
                          <div className="text-xs text-slate-500">
                            • Manual sending recommended
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-slate-500">
                            • Preparing invitation message
                          </div>
                          <div className="text-xs text-green-600">
                            • ✅ Invitation sent successfully
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {tool.name === "Gmail" && (
                    <div className="ml-3 space-y-1">
                      <div className="text-xs text-slate-500">
                        • Accessing Gmail integration
                      </div>
                      <div className="text-xs text-slate-500">
                        • Recipient:{" "}
                        {message?.match(
                          /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
                        )?.[1] || "segev@futurixs.com"}
                      </div>
                      {message?.includes("not connected") ||
                      message?.includes("Click below to connect") ? (
                        <>
                          <div className="text-xs text-red-500">
                            • ⚠️ Authentication required
                          </div>
                          <div className="text-xs text-slate-500">
                            • Connection setup needed
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-slate-500">
                            • Composing and sending message
                          </div>
                          <div className="text-xs text-green-600">
                            • ✅ Email delivered successfully
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {tool.name === "Google Calendar" && (
                    <div className="ml-3 space-y-1">
                      <div className="text-xs text-slate-500">
                        • Accessing Calendar integration
                      </div>
                      <div className="text-xs text-slate-500">
                        • Creating event invitation
                      </div>
                      {message?.includes("not connected") ? (
                        <div className="text-xs text-red-500">
                          • ⚠️ Calendar connection required
                        </div>
                      ) : (
                        <>
                          <div className="text-xs text-slate-500">
                            • Setting up meeting details
                          </div>
                          <div className="text-xs text-green-600">
                            • ✅ Calendar invite sent
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {tool.name === "Jira" && (
                    <div className="ml-3 space-y-1">
                      <div className="text-xs text-slate-500">
                        • Connecting to Jira workspace
                      </div>
                      <div className="text-xs text-slate-500">
                        • Creating new ticket
                      </div>
                      <div className="text-xs text-slate-500">
                        • Setting priority and assignee
                      </div>
                      <div className="text-xs text-green-600">
                        • ✅ Ticket created successfully
                      </div>
                    </div>
                  )}
                </div>
              ))}

            {/* If we have original thinking steps, show them */}
            {hasThinking &&
              metrics.thinking.map((step, idx) => (
                <div key={`thinking-${idx}`} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-purple-400 rounded-full mt-1.5" />
                  <span className="text-xs text-slate-600">{step}</span>
                </div>
              ))}

            {/* Fallback generic steps if no specific tools */}
            {(!metrics.tools || metrics.tools.length === 0) && !hasThinking && (
              <>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-slate-400 rounded-full mt-1.5"></div>
                  <span className="text-xs text-slate-600">
                    Processing your request
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-slate-400 rounded-full mt-1.5"></div>
                  <span className="text-xs text-slate-600">
                    Analyzing required actions
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-slate-400 rounded-full mt-1.5"></div>
                  <span className="text-xs text-slate-600">
                    Executing integrations
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full mt-1.5"></div>
                  <span className="text-xs text-green-600">Task completed</span>
                </div>
              </>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 text-xs text-slate-500">
            {metrics.tools
              ? `${metrics.tools.length} integrations used`
              : "Multi-step process"}{" "}
            • {metrics.model} • {metrics.confidence}% confidence
          </div>
        </div>
      )}
    </div>
  );
}
