import { v4 } from "uuid";
import { safeJsonParse } from "../request";
import { saveAs } from "file-saver";
import { API_BASE } from "../constants";
import { useEffect, useState } from "react";

export const AGENT_SESSION_START = "agentSessionStart";
export const AGENT_SESSION_END = "agentSessionEnd";
const handledEvents = [
  "statusResponse",
  "fileDownload",
  "awaitingFeedback",
  "wssFailure",
  "rechartVisualize",
];

export function websocketURI() {
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  if (API_BASE === "/api") return `${wsProtocol}//${window.location.host}`;
  return `${wsProtocol}//${new URL(import.meta.env.VITE_API_BASE).host}`;
}

export default function handleSocketResponse(event, setChatHistory) {
  const data = safeJsonParse(event.data, null);
  if (data === null) return;

  // Debug logging for development
  console.log("[Agent Response]", data);

  // No message type is defined then this is a generic message
  // that we need to print to the user as a system response
  if (!data.hasOwnProperty("type")) {
    // Handle both string messages and object messages without type
    const messageContent = typeof data === 'string' ? data : (data.content || data.message || JSON.stringify(data));
    
    // Skip empty messages
    if (!messageContent || messageContent.trim() === '') {
      console.log("[Agent Response] Skipping empty message");
      return;
    }
    
    return setChatHistory((prev) => {
      // Remove any pending messages first
      const filtered = prev.filter((msg) => !msg.pending);
      return [
        ...filtered,
        {
          uuid: v4(),
          content: messageContent,
          role: "assistant",
          sources: [],
          closed: true,
          error: null,
          animate: false,
          pending: false,
        },
      ];
    });
  }

  // Allow messages with types not in handledEvents if they have content and look like assistant messages
  if (!handledEvents.includes(data.type)) {
    if (data.content && data.role === "assistant") {
      console.log("[Agent Response] Handling unregistered message type as assistant message:", data.type);
      return setChatHistory((prev) => {
        const filtered = prev.filter((msg) => !msg.pending);
        return [
          ...filtered,
          {
            uuid: v4(),
            content: data.content,
            role: "assistant",
            sources: data.sources || [],
            closed: true,
            error: null,
            animate: false,
            pending: false,
          },
        ];
      });
    }
    if (!data.content) return;
  }

  if (data.type === "fileDownload") {
    saveAs(data.content.b64Content, data.content.filename ?? "unknown.txt");
    return;
  }

  if (data.type === "rechartVisualize") {
    return setChatHistory((prev) => {
      return [
        ...prev.filter((msg) => !!msg.content),
        {
          type: "rechartVisualize",
          uuid: v4(),
          content: data.content,
          role: "assistant",
          sources: [],
          closed: true,
          error: null,
          animate: false,
          pending: false,
        },
      ];
    });
  }

  if (data.type === "wssFailure") {
    return setChatHistory((prev) => {
      return [
        ...prev.filter((msg) => !!msg.content),
        {
          uuid: v4(),
          content: data.content,
          role: "assistant",
          sources: [],
          closed: true,
          error: data.content,
          animate: false,
          pending: false,
        },
      ];
    });
  }

  return setChatHistory((prev) => {
    return [
      ...prev.filter((msg) => !!msg.content),
      {
        uuid: v4(),
        type: data.type,
        content: data.content,
        role: "assistant",
        sources: [],
        closed: true,
        error: null,
        animate: data?.animate || false,
        pending: false,
      },
    ];
  });
}

export function useIsAgentSessionActive() {
  const [activeSession, setActiveSession] = useState(false);
  useEffect(() => {
    function listenForAgentSession() {
      if (!window) return;
      window.addEventListener(AGENT_SESSION_START, () =>
        setActiveSession(true)
      );
      window.addEventListener(AGENT_SESSION_END, () => setActiveSession(false));
    }
    listenForAgentSession();
  }, []);

  return activeSession;
}
