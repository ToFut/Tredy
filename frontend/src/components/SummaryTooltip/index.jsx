import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Sparkle, Clock, ChatCircle, Lightning } from "@phosphor-icons/react";
import Workspace from "@/models/workspace";

export default function SummaryTooltip({ 
  workspace, 
  threadSlug = null,
  anchor,
  isVisible,
  onClose 
}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!isVisible) {
      setSummary(null);
      setLoading(true);
      return;
    }

    fetchSummary();
  }, [isVisible, workspace.slug, threadSlug]);

  useEffect(() => {
    if (!anchor || !tooltipRef.current || !isVisible) return;

    const rect = anchor.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Position to the right of the workspace
    let top = rect.top;
    let left = rect.right + 15;

    // Adjust if tooltip would go off-screen
    if (left + 320 > viewportWidth) {
      left = viewportWidth - 340;
    }

    if (top + tooltipRect.height > viewportHeight) {
      top = Math.max(10, viewportHeight - tooltipRect.height - 10);
    }

    setPosition({ top, left });
  }, [anchor, isVisible, summary]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await Workspace.getQuickSummary(workspace.slug, threadSlug);
      if (response.summary) {
        setSummary(response.summary);
      }
    } catch (error) {
      console.error("Failed to fetch summary:", error);
      setSummary({
        brief: "Unable to load summary",
        topics: [],
        keyPoints: [],
        messageCount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  // Generate a tagline based on workspace name or use default
  const getTagline = () => {
    if (workspace.name.toLowerCase().includes("personal")) {
      return "Your personal AI trained on your needs";
    } else if (workspace.name.toLowerCase().includes("work")) {
      return "Professional workspace for productivity";
    } else if (workspace.name.toLowerCase().includes("research")) {
      return "Research assistant for deep insights";
    } else {
      return "AI-powered workspace for better results";
    }
  };

  // Render tooltip in a portal to escape sidebar clipping
  return createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-[999] animate-fadeIn summary-tooltip"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="relative">
        {/* Arrow pointing to workspace */}
        <div 
          className="absolute -left-3 top-6 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[12px] border-r-white/95"
          style={{ filter: "drop-shadow(-2px 0 4px rgba(0,0,0,0.08))" }}
        />

        {/* Tooltip Content */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl border border-gray-100 shadow-xl p-5 w-[320px] max-h-[450px] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <Sparkle className="animate-pulse text-blue-500 mb-3" size={32} />
                <div className="absolute inset-0 blur-xl bg-blue-400/20 animate-pulse" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Analyzing conversation...</p>
            </div>
          ) : summary ? (
            <div className="space-y-4">
              {/* Header with Title and Tagline */}
              <div className="pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-base">
                    {workspace.name}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500 italic">
                  {getTagline()}
                </p>
              </div>

              {/* Summary Section */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightning className="text-blue-500" size={14} />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Summary</span>
                </div>
                <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-xl p-3 border border-blue-100/50">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {summary.brief || "No summary available yet. Start a conversation to generate insights."}
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-1.5">
                  <ChatCircle className="text-gray-400" size={14} />
                  <span className="text-xs text-gray-600">{summary.messageCount || 0} messages</span>
                </div>
                {summary.lastActivity && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="text-gray-400" size={14} />
                    <span className="text-xs text-gray-600">{formatTime(summary.lastActivity)}</span>
                  </div>
                )}
              </div>

              {/* Topics */}
              {summary.topics && summary.topics.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Key Topics</p>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.topics.slice(0, 5).map((topic, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700 transition-colors cursor-default"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Points */}
              {summary.keyPoints && summary.keyPoints.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Highlights</p>
                  <ul className="space-y-1.5">
                    {summary.keyPoints.slice(0, 3).map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5 text-xs">•</span>
                        <span className="text-xs text-gray-600 leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {summary.actionItems && summary.actionItems.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-orange-600 mb-2">Action Items</p>
                  <ul className="space-y-1">
                    {summary.actionItems.map((item, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                        <input type="checkbox" className="mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer */}
              <div className="pt-3 flex items-center justify-between">
                <p className="text-[10px] text-gray-400">
                  Click workspace to open chat
                </p>
                <button
                  onClick={() => {
                    // Navigate to thread if threadSlug exists, otherwise to workspace
                    const url = threadSlug 
                      ? `/workspace/${workspace.slug}/t/${threadSlug}`
                      : `/workspace/${workspace.slug}`;
                    window.location.href = url;
                  }}
                  className="text-[10px] text-blue-500 hover:text-blue-600 font-medium"
                >
                  Open Chat →
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="mb-3">
                <ChatCircle className="mx-auto text-gray-300" size={32} />
              </div>
              <p className="text-sm text-gray-500">No conversation data available</p>
              <p className="text-xs text-gray-400 mt-1">Start chatting to see insights here</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body // Render in document body to escape sidebar clipping
  );
}

function formatTime(timestamp) {
  if (!timestamp) return "Unknown";
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}