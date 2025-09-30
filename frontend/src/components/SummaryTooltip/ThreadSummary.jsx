import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Workspace from "@/models/workspace";

export default function ThreadSummary({ workspace, threadSlug, children }) {
  const [summary, setSummary] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);

  // Update tooltip position when hovering
  useEffect(() => {
    if (!isHovering || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top,
      left: rect.right + 8, // 8px offset from the right edge
    });
  }, [isHovering]);

  useEffect(() => {
    if (!isHovering || !workspace?.slug) return;

    const fetchSummary = async () => {
      if (loading || summary) return;

      setLoading(true);
      try {
        const authToken = window.localStorage.getItem("tredy_authToken");
        const headers = {
          "Content-Type": "application/json",
        };

        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE || "http://localhost:3001"}/api/workspace/${workspace.slug}/quick-summary${threadSlug ? `?threadSlug=${threadSlug}` : ""}`,
          {
            method: "GET",
            headers,
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSummary(data.summary);
        }
      } catch (error) {
        console.error("Failed to fetch thread summary:", error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch after a short delay to avoid excessive API calls
    const timer = setTimeout(fetchSummary, 500);
    return () => clearTimeout(timer);
  }, [isHovering, workspace?.slug, threadSlug]);

  return (
    <div
      ref={containerRef}
      className="relative inline-block w-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        // Keep summary cached for 5 minutes
        setTimeout(() => setSummary(null), 5 * 60 * 1000);
      }}
    >
      {children}

      {/* Tooltip rendered in portal */}
      {isHovering &&
        summary &&
        createPortal(
          <div
            className="fixed z-[999] animate-fadeIn"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
            }}
          >
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 p-3 min-w-[250px] max-w-[350px]">
              {/* Overview Section */}
              {summary.overview && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {summary.overview}
                  </p>
                </div>
              )}

              {/* Details Section */}
              {summary.details && (
                <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">
                  {summary.details.split("\n").map((line, i) => (
                    <p key={i} className="mt-1">
                      {line.trim().startsWith("-") ? line : `• ${line}`}
                    </p>
                  ))}
                </div>
              )}

              {/* Metadata */}
              <div className="pt-2 border-t border-gray-200 dark:border-zinc-700 flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {summary.messageCount || 0} messages
                </span>
                {summary.topics && summary.topics.length > 0 && (
                  <div className="flex gap-1">
                    {summary.topics.slice(0, 3).map((topic, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Loading indicator */}
      {isHovering &&
        loading &&
        !summary &&
        createPortal(
          <div
            className="fixed z-[999]"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
            }}
          >
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 p-3">
              <div className="animate-pulse">
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-32 mb-2"></div>
                <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded w-24"></div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
