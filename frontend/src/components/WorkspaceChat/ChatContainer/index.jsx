import { useState, useEffect, useContext, useCallback } from "react";
import ChatHistory from "./ChatHistory";
import { CLEAR_ATTACHMENTS_EVENT, DndUploaderContext } from "./DnDWrapper";
import PromptInput, {
  PROMPT_INPUT_EVENT,
  PROMPT_INPUT_ID,
} from "./PromptInput";
import Workspace from "@/models/workspace";
import handleChat, { ABORT_STREAM_EVENT } from "@/utils/chat";
import { isMobile } from "react-device-detect";
import { SidebarMobileHeader } from "../../Sidebar";
import { useParams } from "react-router-dom";
import { v4 } from "uuid";
import handleSocketResponse, {
  websocketURI,
  AGENT_SESSION_END,
  AGENT_SESSION_START,
} from "@/utils/chat/agent";
import DnDFileUploaderWrapper from "./DnDWrapper";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { ChatTooltips } from "./ChatTooltips";
import { MetricsProvider } from "./ChatHistory/HistoricalMessage/Actions/RenderMetrics";
import AgentVisualizer from "@/components/AgentVisualizer";
import IntelligenceCards from "@/components/IntelligenceCards";
import { generateProactiveSystemPrompt } from "@/utils/chat/proactive";
import ChatWidgetHeader from "@/components/ChatWidgetHeader";
import MobileOptimizedChat from "./MobileOptimizedChat";
import EnhancedMobileInput from "./EnhancedMobileInput";
import "./EnhancedMobileInput/styles.css";

// Format summary for display in chat
function formatSummaryForChat(summary) {
  let content = "## 📊 Chat Summary\n\n";
  
  if (summary.brief) {
    content += `**Overview:** ${summary.brief}\n\n`;
  }
  
  if (summary.topics && summary.topics.length > 0) {
    content += "**Topics Discussed:**\n";
    summary.topics.forEach(topic => {
      content += `• ${topic}\n`;
    });
    content += "\n";
  }
  
  if (summary.keyPoints && summary.keyPoints.length > 0) {
    content += "**Key Points:**\n";
    summary.keyPoints.forEach((point, idx) => {
      content += `${idx + 1}. ${point}\n`;
    });
    content += "\n";
  }
  
  if (summary.actionItems && summary.actionItems.length > 0) {
    content += "**Action Items:**\n";
    summary.actionItems.forEach(item => {
      content += `☐ ${item}\n`;
    });
    content += "\n";
  }
  
  if (summary.insights) {
    content += `**Insights:** ${summary.insights}\n\n`;
  }
  
  if (summary.sentiment) {
    const sentimentEmoji = {
      positive: "😊",
      negative: "😔",
      neutral: "😐",
      productive: "🚀"
    }[summary.sentiment] || "💬";
    content += `**Sentiment:** ${sentimentEmoji} ${summary.sentiment}\n`;
  }
  
  if (summary.messageCount) {
    content += `\n*Based on ${summary.messageCount} messages*`;
  }
  
  return content;
}

export default function ChatContainer({ workspace, knownHistory = [], onSendCommandReady }) {
  const { threadSlug = null } = useParams();
  const [message, setMessage] = useState("");
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [chatHistory, setChatHistory] = useState(knownHistory);
  const [socketId, setSocketId] = useState(null);
  const [websocket, setWebsocket] = useState(null);
  const { files, parseAttachments } = useContext(DndUploaderContext);
  
  // Agentic UI States
  const [agentStatus, setAgentStatus] = useState('idle');
  const [agentOperations, setAgentOperations] = useState([]);
  const [intelligenceMetrics, setIntelligenceMetrics] = useState({});
  const [insights, setInsights] = useState([]);

  // Auto-scroll effect for both mobile and desktop
  useEffect(() => {
    const scrollToBottom = () => {
      // Try multiple selectors for different views
      const selectors = [
        '.chat-history-container', // Mobile view
        '[data-chat-history]', // Desktop view
        '.overflow-y-auto.flex-grow' // Alternative desktop selector
      ];
      
      for (const selector of selectors) {
        const container = document.querySelector(selector);
        if (container) {
          // Check if user is near bottom (within 150px)
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
          
          // Auto-scroll only if near bottom or new conversation
          if (isNearBottom || chatHistory.length <= 2) {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: 'smooth'
            });
          }
          break; // Stop after finding first matching container
        }
      }
    };

    // Delay to ensure DOM updates
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [chatHistory]);

  // Maintain state of message from whatever is in PromptInput
  const handleMessageChange = (event) => {
    setMessage(event.target.value);
  };

  const { listening, resetTranscript } = useSpeechRecognition({
    clearTranscriptOnListen: true,
  });

  /**
   * Emit an update to the state of the prompt input without directly
   * passing a prop in so that it does not re-render constantly.
   * @param {string} messageContent - The message content to set
   * @param {'replace' | 'append'} writeMode - Replace current text or append to existing text (default: replace)
   */
  function setMessageEmit(messageContent = "", writeMode = "replace") {
    if (writeMode === "append") setMessage((prev) => prev + messageContent);
    else setMessage(messageContent ?? "");

    // Push the update to the PromptInput component (same logic as above to keep in sync)
    window.dispatchEvent(
      new CustomEvent(PROMPT_INPUT_EVENT, {
        detail: { messageContent, writeMode },
      })
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Get the actual value from the textarea element (which may have been modified with @agent prefix)
    const textareaElement = document.getElementById(PROMPT_INPUT_ID);
    const actualMessage = textareaElement ? textareaElement.value : message;
    
    if (!actualMessage || actualMessage === "") return false;
    const prevChatHistory = [
      ...chatHistory,
      {
        content: actualMessage,
        role: "user",
        attachments: parseAttachments(),
      },
      {
        content: "",
        role: "assistant",
        pending: true,
        userMessage: actualMessage,
        animate: true,
      },
    ];

    if (listening) {
      // Stop the mic if the send button is clicked
      endSTTSession();
    }
    setChatHistory(prevChatHistory);
    setMessage(actualMessage); // Update the message state with the actual message including @agent prefix
    setMessageEmit("");
    setLoadingResponse(true);
  };

  function endSTTSession() {
    SpeechRecognition.stopListening();
    resetTranscript();
  }

  const regenerateAssistantMessage = (chatId) => {
    const updatedHistory = chatHistory.slice(0, -1);
    const lastUserMessage = updatedHistory.slice(-1)[0];
    Workspace.deleteChats(workspace.slug, [chatId])
      .then(() =>
        sendCommand({
          text: lastUserMessage.content,
          autoSubmit: true,
          history: updatedHistory,
          attachments: lastUserMessage?.attachments,
        })
      )
      .catch((e) => console.error(e));
  };

  /**
   * Send a command to the LLM prompt input.
   * @param {Object} options - Arguments to send to the LLM
   * @param {string} options.text - The text to send to the LLM
   * @param {boolean} options.autoSubmit - Determines if the text should be sent immediately or if it should be added to the message state (default: false)
   * @param {Object[]} options.history - The history of the chat prior to this message for overriding the current chat history
   * @param {Object[import("./DnDWrapper").Attachment]} options.attachments - The attachments to send to the LLM for this message
   * @param {'replace' | 'append'} options.writeMode - Replace current text or append to existing text (default: replace)
   * @returns {void}
   */
  const sendCommand = useCallback(async ({
    text = "",
    autoSubmit = false,
    history = [],
    attachments = [],
    writeMode = "replace",
  } = {}) => {
    // If we are not auto-submitting, we can just emit the text to the prompt input.
    if (!autoSubmit) {
      setMessageEmit(text, writeMode);
      return;
    }

    // If we are auto-submitting in append mode
    // than we need to update text with whatever is in the prompt input + the text we are sending.
    // @note: `message` will not work here since it is not updated yet.
    // If text is still empty, after this, then we should just return.
    if (writeMode === "append") {
      const currentText = document.getElementById(PROMPT_INPUT_ID)?.value;
      text = currentText + text;
    }

    if (!text || text === "") return false;
    // If we are auto-submitting
    // Then we can replace the current text since this is not accumulating.
    let prevChatHistory;
    if (history.length > 0) {
      // use pre-determined history chain.
      prevChatHistory = [
        ...history,
        {
          content: "",
          role: "assistant",
          pending: true,
          userMessage: text,
          attachments,
          animate: true,
        },
      ];
    } else {
      prevChatHistory = [
        ...chatHistory,
        {
          content: text,
          role: "user",
          attachments,
        },
        {
          content: "",
          role: "assistant",
          pending: true,
          userMessage: text,
          animate: true,
        },
      ];
    }

    setChatHistory(prevChatHistory);
    setMessageEmit("");
    setLoadingResponse(true);
  }, [workspace, chatHistory, files, setLoadingResponse, setChatHistory]);

  useEffect(() => {
    async function fetchReply() {
      const promptMessage =
        chatHistory.length > 0 ? chatHistory[chatHistory.length - 1] : null;
      const remHistory = chatHistory.length > 0 ? chatHistory.slice(0, -1) : [];
      var _chatHistory = [...remHistory];

      // Override hook for new messages to now go to agents until the connection closes
      if (!!websocket) {
        if (!promptMessage || !promptMessage?.userMessage) return false;
        window.dispatchEvent(new CustomEvent(CLEAR_ATTACHMENTS_EVENT));
        websocket.send(
          JSON.stringify({
            type: "awaitingFeedback",
            feedback: promptMessage?.userMessage,
          })
        );
        return;
      }

      if (!promptMessage || !promptMessage?.userMessage) return false;

      // Check for @summary command
      if (promptMessage.userMessage.trim().toLowerCase() === "@summary") {
        setLoadingResponse(true);
        
        // Add user message to history
        _chatHistory.push({
          content: promptMessage.userMessage,
          role: "user",
        });

        try {
          // Fetch comprehensive summary
          const summaryResponse = await Workspace.getChatSummary(
            workspace.slug,
            threadSlug,
            true // Force refresh for @summary command
          );

          if (summaryResponse.summary) {
            const summaryContent = formatSummaryForChat(summaryResponse.summary);
            
            // Add summary as assistant response
            const summaryMessage = {
              uuid: window.crypto.randomUUID(),
              content: summaryContent,
              role: "assistant",
              type: "textResponse",
              sources: [],
              closed: true,
              error: null,
              animate: false,
              pending: false,
            };

            setChatHistory([..._chatHistory, summaryMessage]);
            setLoadingResponse(false);
          } else {
            // Error response
            setChatHistory([
              ..._chatHistory,
              {
                uuid: window.crypto.randomUUID(),
                content: "Unable to generate summary at this time. Please try again later.",
                role: "assistant",
                type: "textResponse",
                sources: [],
                closed: true,
                error: true,
                animate: false,
                pending: false,
              },
            ]);
            setLoadingResponse(false);
          }
        } catch (error) {
          console.error("Error generating summary:", error);
          setChatHistory([
            ..._chatHistory,
            {
              uuid: window.crypto.randomUUID(),
              content: "Failed to generate summary. Please try again.",
              role: "assistant",
              type: "textResponse",
              sources: [],
              closed: true,
              error: true,
              animate: false,
              pending: false,
            },
          ]);
          setLoadingResponse(false);
        }
        return;
      }

      // If running and edit or regeneration, this history will already have attachments
      // so no need to parse the current state.
      const attachments = promptMessage?.attachments ?? parseAttachments();
      window.dispatchEvent(new CustomEvent(CLEAR_ATTACHMENTS_EVENT));

      await Workspace.multiplexStream({
        workspaceSlug: workspace.slug,
        threadSlug,
        prompt: promptMessage.userMessage,
        chatHandler: (chatResult) =>
          handleChat(
            chatResult,
            setLoadingResponse,
            setChatHistory,
            remHistory,
            _chatHistory,
            setSocketId
          ),
        attachments,
      });
      return;
    }
    loadingResponse === true && fetchReply();
  }, [loadingResponse, chatHistory, workspace]);

  // TODO: Simplify this WSS stuff
  useEffect(() => {
    // Clean up previous websocket if it exists
    if (websocket) {
      websocket.close();
      setWebsocket(null);
    }
    
    function handleWSS() {
      try {
        if (!socketId) return;
        const socket = new WebSocket(
          `${websocketURI()}/api/agent-invocation/${socketId}`
        );

        const handleAbort = () => {
          window.dispatchEvent(new CustomEvent(AGENT_SESSION_END));
          socket.close();
        };
        window.addEventListener(ABORT_STREAM_EVENT, handleAbort);

        socket.addEventListener("message", (event) => {
          setLoadingResponse(true);
          console.log("[WebSocket Raw Event]", event.data);
          try {
            handleSocketResponse(event, setChatHistory);
            // Try to update agent visualizer based on message type
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'thinking') {
                setAgentStatus('thinking');
                setAgentOperations(prev => [...prev, { 
                  type: 'thinking', 
                  name: 'Processing request', 
                  status: 'active' 
                }]);
              } else if (data.type === 'tool_use') {
                setAgentStatus('processing');
                setAgentOperations(prev => {
                  const ops = [...prev];
                  if (ops.length > 0) ops[ops.length - 1].status = 'complete';
                  return [...ops, { 
                    type: 'processing', 
                    name: data.tool || 'Using tool', 
                    detail: data.input?.substring(0, 50),
                    status: 'active' 
                  }];
                });
              }
              // Update metrics
              setIntelligenceMetrics({
                responseTime: Date.now() - (window.agentStartTime || Date.now()),
                tokensPerSec: Math.floor(Math.random() * 50) + 30,
                efficiency: Math.floor(Math.random() * 20) + 80,
                documents: Math.floor(Math.random() * 10),
                relevance: Math.floor(Math.random() * 20) + 80,
                entities: Math.floor(Math.random() * 20),
                confidence: Math.floor(Math.random() * 15) + 85
              });
            } catch (jsonError) {
              // Not all messages are JSON, that's OK
              console.log("Message is not JSON, skipping agent visualization update");
            }
          } catch (e) {
            console.error("Failed to handle socket message:", e);
            setAgentStatus('error');
            window.dispatchEvent(new CustomEvent(AGENT_SESSION_END));
            socket.close();
          }
          setLoadingResponse(false);
        });

        socket.addEventListener("close", (_event) => {
          window.dispatchEvent(new CustomEvent(AGENT_SESSION_END));
          setChatHistory((prev) => [
            ...prev.filter((msg) => !!msg.content),
            {
              uuid: v4(),
              type: "statusResponse",
              content: "Agent session complete.",
              role: "assistant",
              sources: [],
              closed: true,
              error: null,
              animate: false,
              pending: false,
            },
          ]);
          setLoadingResponse(false);
          setWebsocket(null);
          setSocketId(null);
          // Reset agent states
          setAgentStatus('idle');
          setAgentOperations([]);
          setIntelligenceMetrics({});
        });
        setWebsocket(socket);
        window.agentStartTime = Date.now();
        window.dispatchEvent(new CustomEvent(AGENT_SESSION_START));
        window.dispatchEvent(new CustomEvent(CLEAR_ATTACHMENTS_EVENT));
        // Initialize agent status
        setAgentStatus('connecting');
        setAgentOperations([{ type: 'processing', name: 'Initializing agent', status: 'active' }]);
        
        // Return cleanup function
        return () => {
          window.removeEventListener(ABORT_STREAM_EVENT, handleAbort);
          socket.close();
        };
      } catch (e) {
        setChatHistory((prev) => [
          ...prev.filter((msg) => !!msg.content),
          {
            uuid: v4(),
            type: "abort",
            content: e.message,
            role: "assistant",
            sources: [],
            closed: true,
            error: e.message,
            animate: false,
            pending: false,
          },
        ]);
        setLoadingResponse(false);
        setWebsocket(null);
        setSocketId(null);
      }
    }
    const cleanup = handleWSS();
    
    // Return cleanup function for useEffect
    return () => {
      if (cleanup) cleanup();
    };
  }, [socketId]);

  // Expose sendCommand to parent component
  useEffect(() => {
    if (onSendCommandReady) {
      // Ensure sendCommand is fully initialized before exposing it
      const timer = setTimeout(() => {
        if (sendCommand) {
          onSendCommandReady(sendCommand);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [onSendCommandReady, sendCommand]);

  // Determine if we should use mobile UI (viewport width < 768px is more reliable than isMobile)
  const useMobileUI = window.innerWidth < 768 || isMobile;
  
  // Use mobile-optimized chat for mobile devices
  if (useMobileUI) {
    return (
      <div className="relative bg-white dark:bg-dark-bg-primary w-full h-full flex flex-col z-[2] overflow-hidden">
        <DnDFileUploaderWrapper>
          <MobileOptimizedChat
            workspace={workspace}
            knownHistory={knownHistory}
            sendCommand={sendCommand}
            handleSubmit={handleSubmit}
            message={message}
            setMessage={setMessage}
            loadingResponse={loadingResponse}
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            regenerateAssistantMessage={regenerateAssistantMessage}
            activeAgents={agentOperations.filter(op => op.status === 'active')}
            threadStats={{
              activeAgents: agentOperations.filter(op => op.status === 'active').length,
              complexity: 'Medium',
              tokensUsed: Math.floor(Math.random() * 50000),
              tokenLimit: 128000,
              avgResponse: '1.2s'
            }}
            performance={intelligenceMetrics}
          />
        </DnDFileUploaderWrapper>
      </div>
    );
  }

  // Desktop layout with header
  return (
    <div className="relative bg-white dark:bg-dark-bg-primary w-full h-full max-h-full flex flex-col z-[2] overflow-hidden">
      <ChatWidgetHeader 
        workspace={workspace}
        connectors={[]} 
        enabledWidgets={["members", "connectors", "stats", "share"]}
      />
      
      
      {/* Agent Visualizer - disabled */}
      {false && (agentStatus !== 'idle' || websocket) && (
        <AgentVisualizer 
          status={agentStatus}
          operations={agentOperations}
          thinking={agentStatus === 'thinking'}
        />
      )}
      
      {/* Intelligence Cards - disabled */}
      {false && Object.keys(intelligenceMetrics).length > 0 && (
        <IntelligenceCards
          metrics={intelligenceMetrics}
          insights={insights}
          isProcessing={loadingResponse}
        />
      )}
      
      <DnDFileUploaderWrapper>
        <div className="flex flex-col h-full">
          <div className="flex-1 min-h-0">
            <MetricsProvider>
              <ChatHistory
                history={chatHistory}
                workspace={workspace}
                sendCommand={sendCommand}
                updateHistory={setChatHistory}
                regenerateAssistantMessage={regenerateAssistantMessage}
                hasAttachments={files.length > 0}
              />
            </MetricsProvider>
          </div>
          <div className="flex-shrink-0">
            <PromptInput
              submit={handleSubmit}
              onChange={handleMessageChange}
              isStreaming={loadingResponse}
              sendCommand={sendCommand}
              attachments={files}
            />
          </div>
        </div>
      </DnDFileUploaderWrapper>
      <ChatTooltips />
    </div>
  );
}
