import React, { useState, useEffect } from "react";
import { Cpu, Lightning, ChartBar } from "@phosphor-icons/react";

/**
 * Elegant token counter component that displays live metrics under agent responses
 * Creates an "agentic feeling" with smooth animations and real-time updates
 */
export default function TokenCounter({
  metrics = {},
  isStreaming = false,
  isAgent = false,
  className = "",
}) {
  const [displayTokens, setDisplayTokens] = useState(0);
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Animate token count
  useEffect(() => {
    if (!metrics?.completion_tokens) return;

    setIsVisible(true);
    const targetTokens = metrics.completion_tokens;
    const increment = Math.max(1, Math.floor(targetTokens / 20));
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= targetTokens) {
        setDisplayTokens(targetTokens);
        clearInterval(interval);
      } else {
        setDisplayTokens(current);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [metrics?.completion_tokens]);

  // Animate speed
  useEffect(() => {
    if (!metrics?.outputTps) return;

    const targetSpeed = metrics.outputTps;
    const increment = targetSpeed / 10;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= targetSpeed) {
        setDisplaySpeed(targetSpeed);
        clearInterval(interval);
      } else {
        setDisplaySpeed(current);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [metrics?.outputTps]);

  if (!metrics || (!metrics.completion_tokens && !isStreaming)) return null;

  const formatDuration = (duration) => {
    if (!duration) return "0ms";
    return duration < 1
      ? `${(duration * 1000).toFixed(0)}ms`
      : `${duration.toFixed(1)}s`;
  };

  return (
    <div
      className={`${className} ${isVisible ? "animate-fadeIn" : "opacity-0"} transition-all duration-500`}
    >
      <div
        className={`
        inline-flex items-center gap-4 px-4 py-2 mt-3
        ${
          isAgent
            ? "bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20"
            : "bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
        }
        rounded-xl backdrop-blur-sm
        ${isStreaming ? "animate-pulse" : ""}
      `}
      >
        {/* Token Count */}
        <div className="flex items-center gap-2">
          <div
            className={`
            p-1.5 rounded-lg 
            ${
              isAgent
                ? "bg-gradient-to-br from-purple-500 to-blue-500"
                : "bg-gray-600 dark:bg-gray-400"
            }
          `}
          >
            <ChartBar className="w-3.5 h-3.5 text-white" weight="fill" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Tokens
            </span>
            <span
              className={`
              text-sm font-bold
              ${
                isAgent
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
                  : "text-gray-700 dark:text-gray-300"
              }
            `}
            >
              {isStreaming && !metrics.completion_tokens ? (
                <span className="inline-flex gap-1">
                  <span className="animate-pulse">•</span>
                  <span className="animate-pulse animation-delay-200">•</span>
                  <span className="animate-pulse animation-delay-400">•</span>
                </span>
              ) : (
                displayTokens.toLocaleString()
              )}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 opacity-30" />

        {/* Speed */}
        <div className="flex items-center gap-2">
          <div
            className={`
            p-1.5 rounded-lg
            ${
              isAgent
                ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                : "bg-gray-600 dark:bg-gray-400"
            }
          `}
          >
            <Lightning className="w-3.5 h-3.5 text-white" weight="fill" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Speed
            </span>
            <span
              className={`
              text-sm font-bold
              ${
                isAgent
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"
                  : "text-gray-700 dark:text-gray-300"
              }
            `}
            >
              {isStreaming && !metrics.outputTps
                ? "measuring..."
                : `${displaySpeed.toFixed(1)} tok/s`}
            </span>
          </div>
        </div>

        {/* Duration (only show when complete) */}
        {metrics.duration && !isStreaming && (
          <>
            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 opacity-30" />
            <div className="flex items-center gap-2">
              <div
                className={`
                p-1.5 rounded-lg
                ${
                  isAgent
                    ? "bg-gradient-to-br from-cyan-500 to-teal-500"
                    : "bg-gray-600 dark:bg-gray-400"
                }
              `}
              >
                <Cpu className="w-3.5 h-3.5 text-white" weight="fill" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                  Time
                </span>
                <span
                  className={`
                  text-sm font-bold
                  ${
                    isAgent
                      ? "bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent"
                      : "text-gray-700 dark:text-gray-300"
                  }
                `}
                >
                  {formatDuration(metrics.duration)}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Agent Badge */}
        {isAgent && (
          <>
            <div className="h-8 w-px bg-purple-300 dark:bg-purple-600 opacity-30" />
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-sm animate-pulse" />
                <span className="relative px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  AI Agent
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
