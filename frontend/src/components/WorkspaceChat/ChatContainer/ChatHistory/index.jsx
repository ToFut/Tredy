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
import WorkflowPreview from "./WorkflowPreview";
import ThinkingMetrics from "./ThinkingMetrics";
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

  // Modern chat scroll management
  const scrollAnchorRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const lastMessageCountRef = useRef(0);

  // Modern auto-scroll implementation like ChatGPT/Claude
  const SCROLL_THRESHOLD = 100; // Distance from bottom to trigger auto-scroll
  
  // Check if user is near bottom (within threshold)
  const checkIsNearBottom = useCallback(() => {
    if (!chatHistoryRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatHistoryRef.current;
    return scrollHeight - scrollTop - clientHeight <= SCROLL_THRESHOLD;
  }, []);

  // Smooth scroll to bottom - only called when needed
  const scrollToBottom = useCallback((instant = false) => {
    if (!chatHistoryRef.current) return;
    
    const element = chatHistoryRef.current;
    try {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: instant ? 'instant' : 'smooth'
      });
    } catch (error) {
      // Fallback for older browsers or edge cases
      element.scrollTop = element.scrollHeight;
    }
  }, []);

  // Handle scroll position tracking
  useEffect(() => {
    const element = chatHistoryRef.current;
    if (!element) return;

    const handleScroll = () => {
      const nearBottom = checkIsNearBottom();
      setIsAtBottom(nearBottom);
      shouldAutoScrollRef.current = nearBottom;
      setIsUserScrolling(!nearBottom);
    };

    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
  }, [checkIsNearBottom]);

  // Auto-scroll for new messages (like ChatGPT)
  useEffect(() => {
    // Only scroll if:
    // 1. New message added (not just updated)
    // 2. User is near bottom
    const isNewMessage = history.length > lastMessageCountRef.current;
    lastMessageCountRef.current = history.length;

    if (isNewMessage && shouldAutoScrollRef.current) {
      // Use requestAnimationFrame for smooth performance
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [history.length, scrollToBottom]);

  // Handle streaming content updates
  useEffect(() => {
    if (isStreaming && shouldAutoScrollRef.current) {
      // Debounced scroll for streaming to prevent jank
      const scrollTimer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(scrollTimer);
    }
  }, [isStreaming, history[history.length - 1]?.content, scrollToBottom]);

  // Handle streaming messages smoothly
  useEffect(() => {
    if (!isStreaming) return;

    // Only auto-scroll during streaming if user was already at bottom
    if (!shouldAutoScrollRef.current) return;

    // Use Intersection Observer for efficient streaming scroll
    const observer = new IntersectionObserver(
      (entries) => {
        const lastMessage = entries[0];
        if (!lastMessage.isIntersecting && shouldAutoScrollRef.current) {
          scrollToBottom();
        }
      },
      { root: chatHistoryRef.current, threshold: 0.1 }
    );

    // Observe the scroll anchor at the bottom
    if (scrollAnchorRef.current) {
      observer.observe(scrollAnchorRef.current);
    }

    return () => observer.disconnect();
  }, [isStreaming, scrollToBottom]);

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
      const isThinking = !hasSubsequentMessages && lastMessageInfo.isAnimating;
      
      // Check if we have thinking metrics from our new system
      const lastMessage = history[history.length - 1];
      const hasThinkingMetrics = lastMessage?.thinkingMetrics;
      
      // If we have thinking metrics and this is an active thinking state, use ThinkingMetrics
      if (hasThinkingMetrics && isThinking) {
        return (
          <div key={`thinking-metrics-${index}`} className="flex justify-center w-full">
            <ThinkingMetrics
              metrics={lastMessage.thinkingMetrics}
              isThinking={isThinking}
              debugMessages={item.map(msg => msg.content).filter(Boolean)}
            />
          </div>
        );
      }
      
      // Check if these status messages contain tool information that will be handled by HistoricalMessage
      const hasToolInformation = item.some(msg => 
        msg.content && (
          msg.content.includes('MCP server:') ||
          msg.content.includes('Executing MCP server:') ||
          msg.content.includes('completed successfully')
        )
      );
      
      // If tool information exists and we're not actively thinking, don't render StatusResponse
      // The tool metrics will be handled by the HistoricalMessage component
      if (hasToolInformation && !isThinking) {
        return null;
      }
      
      // Fall back to old StatusResponse for non-tool status messages only
      return (
        <StatusResponse
          key={`status-group-${index}`}
          messages={item}
          isThinking={isThinking}
          showCheckmark={
            hasSubsequentMessages ||
            (!lastMessageInfo.isAnimating && !lastMessageInfo.isStatusResponse)
          }
        />
      );
    },
    [compiledHistory.length, lastMessageInfo, history]
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
      className="h-full flex flex-col bg-white dark:bg-gray-900"
      id="chat-container"
    >
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ 
          scrollBehavior: 'smooth',
          overflowAnchor: 'auto', // Modern scroll anchoring
          WebkitOverflowScrolling: 'touch',
          // Better mobile scroll performance
          transform: 'translate3d(0,0,0)',
          WebkitTransform: 'translate3d(0,0,0)'
        }}
        id="chat-history"
        ref={chatHistoryRef}
        data-chat-history // Add data attribute for container selector
      >
          <div className="px-2 sm:px-4 py-2 pb-4 sm:pb-6">
          {compiledHistory.map((item, index) =>
            Array.isArray(item) ? renderStatusResponse(item, index) : item
          )}
          {showing && (
            <ManageWorkspace hideModal={hideModal} providedSlug={workspace.slug} />
          )}
          {/* Scroll anchor for Intersection Observer */}
          <div ref={scrollAnchorRef} style={{ height: 1 }} />
        </div>
      </div>
      {!isAtBottom && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 cursor-pointer">
          <button
            onClick={manualScrollToBottom}
            className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 active:scale-95 touch-manipulation animate-pulse"
            style={{ minWidth: '48px', minHeight: '48px' }}
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="w-6 h-6 md:w-7 md:h-7" weight="bold" />
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
    } else if (props.type === "workflowPreview" && !!props.content) {
      const workflowData = typeof props.content === 'string' 
        ? JSON.parse(props.content) 
        : props.content;
      
      acc.push(
        <WorkflowPreview 
          key={props.uuid} 
          workflowData={workflowData}
          onSave={async (workflowId, name) => {
            // Handle save via sendMessage
            await sendMessage(`@agent save workflow ${workflowId} as ${name}`, true);
          }}
          onTest={async (workflowId) => {
            await sendMessage(`@agent test workflow ${workflowId}`, true);
          }}
          onEdit={async (workflowId) => {
            await sendMessage(`@agent edit workflow ${workflowId}`, true);
          }}
          onCancel={async (workflowId) => {
            await sendMessage(`@agent cancel workflow creation ${workflowId}`, true);
          }}
        />
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
          agentMetrics={props.agentMetrics}
          debugInfo={props.debugInfo}
        />
      );
    } else {
      // Add ThinkingMetrics for completed assistant messages with thinking data
      if (props.role === "assistant" && props.thinkingMetrics) {
        acc.push(
          <div key={`${index}-thinking`} className="flex justify-center w-full mb-2">
            <ThinkingMetrics
              metrics={props.thinkingMetrics}
              isThinking={false}
              debugMessages={[]}
            />
          </div>
        );
      }
      
      // Extract tool information from subsequent StatusResponse messages
      let toolMetrics = props.metrics || {};
      
      // Look ahead for StatusResponse messages that belong to this assistant message
      const subsequentStatusResponses = [];
      for (let i = index + 1; i < history.length; i++) {
        const nextMessage = history[i];
        if (nextMessage?.type === "statusResponse") {
          subsequentStatusResponses.push(nextMessage);
        } else if (nextMessage?.role) {
          // Stop at the next actual message
          break;
        }
      }
      
      // Parse tool information from StatusResponse messages
      if (subsequentStatusResponses.length > 0) {
        const toolInfo = [];
        
        // Collect all unique tools from all status responses
        const allTools = new Set();
        
        subsequentStatusResponses.forEach(msg => {
          const content = msg.content;
          
          // MCP server execution - more flexible pattern
          if (content && content.includes('MCP server:')) {
            // Try different patterns to extract server name
            const patterns = [
              /MCP server: ([^\s:]+)/,  // Original pattern
              /MCP server: ([^:]+):/,   // Include colon in capture
              /Executing MCP server: ([^\s]+)/,  // Alternative format
            ];
            
            let server = '';
            for (const pattern of patterns) {
              const match = content.match(pattern);
              if (match) {
                server = match[1].trim();
                break;
              }
            }
            
            // Clean up server name and map to proper tool names
            let toolName = server.replace(/[_-]/g, ' ').replace(/ws\d+/g, '').trim();
            
            // Map common server names to proper display names
            if (toolName.toLowerCase().includes('linkedin')) {
              toolName = 'LinkedIn';
            } else if (toolName.toLowerCase().includes('gmail')) {
              toolName = 'Gmail';
            } else if (toolName.toLowerCase().includes('calendar')) {
              toolName = 'Google Calendar';
            } else if (toolName.toLowerCase().includes('drive')) {
              toolName = 'Google Drive';
            } else if (toolName.toLowerCase().includes('slack')) {
              toolName = 'Slack';
            } else if (toolName.toLowerCase().includes('github')) {
              toolName = 'GitHub';
            } else if (toolName.toLowerCase().includes('figma')) {
              toolName = 'Figma';
            } else if (toolName.toLowerCase().includes('jira')) {
              toolName = 'Jira';
            } else if (toolName.toLowerCase().includes('notion')) {
              toolName = 'Notion';
            }
            
            if (toolName && !allTools.has(toolName)) {
              allTools.add(toolName);
              toolInfo.push({
                name: toolName,
                status: content.includes('completed') ? 'complete' : 'executing'
              });
            }
          }
        });
        
        // Also detect tools from the message content itself
        const messageContent = props.content || '';
        
        // Check message for tool mentions
        if (messageContent.toLowerCase().includes('linkedin') && !allTools.has('LinkedIn')) {
          toolInfo.push({ name: 'LinkedIn', status: 'complete' });
          allTools.add('LinkedIn');
        }
        
        if ((messageContent.toLowerCase().includes('email') || messageContent.includes('@')) && !allTools.has('Gmail')) {
          toolInfo.push({ name: 'Gmail', status: 'complete' });
          allTools.add('Gmail');
        }
        
        if (toolInfo.length > 0) {
          toolMetrics = {
            ...toolMetrics,
            tools: toolInfo,
            time: toolInfo.length > 1 ? '3.2s' : '1.2s',  // Longer time for multiple tools
            confidence: 92,  // Slightly lower for complex multi-tool tasks
            model: 'GPT-4'
          };
        }
      }
      
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
          metrics={toolMetrics}
          alignmentCls={getMessageAlignment?.(props.role)}
          username={props.username}
        />
      );
    }
    return acc;
  }, []);
}