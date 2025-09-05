import React, { useState, useEffect, useRef } from "react";
import { Clock, CheckCircle, XCircle, CircleNotch } from "@phosphor-icons/react";
import AgentSchedule from "@/models/agentSchedule";
import useUser from "@/hooks/useUser";

export default function BackgroundTasksBubble({ workspace, size = 40 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [activeExecutions, setActiveExecutions] = useState({});
  const [recentCompleted, setRecentCompleted] = useState([]);
  const [socket, setSocket] = useState(null);
  const dropdownRef = useRef(null);
  const { user } = useUser();

  // Load schedules
  useEffect(() => {
    if (!workspace?.slug) return;
    loadSchedules();
  }, [workspace?.slug]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!workspace?.slug) return;
    
    // Connect to workspace WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/workspace/${workspace.slug}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log("Connected to schedule events");
      setSocket(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleScheduleEvent(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    ws.onclose = () => {
      console.log("Disconnected from schedule events");
      setSocket(null);
    };
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [workspace?.slug]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const loadSchedules = async () => {
    try {
      const response = await AgentSchedule.list(workspace.slug);
      if (response?.schedules) {
        setSchedules(response.schedules);
      }
    } catch (error) {
      console.error("Failed to load schedules:", error);
    }
  };

  const handleScheduleEvent = (data) => {
    switch (data.type) {
      case "schedule:started":
        setActiveExecutions(prev => ({
          ...prev,
          [data.scheduleId]: {
            name: data.scheduleName,
            startedAt: data.timestamp,
            status: "running"
          }
        }));
        showNotification(`Started: ${data.scheduleName}`, "info");
        break;
        
      case "schedule:completed":
        // Move from active to completed
        setActiveExecutions(prev => {
          const updated = { ...prev };
          delete updated[data.scheduleId];
          return updated;
        });
        
        setRecentCompleted(prev => [
          {
            id: data.scheduleId,
            name: data.scheduleName,
            completedAt: data.timestamp,
            success: true,
            result: data.result,
            duration: data.duration
          },
          ...prev.slice(0, 4) // Keep only 5 recent
        ]);
        
        showNotification(`Completed: ${data.scheduleName}`, "success");
        break;
        
      case "schedule:failed":
        setActiveExecutions(prev => {
          const updated = { ...prev };
          delete updated[data.scheduleId];
          return updated;
        });
        
        setRecentCompleted(prev => [
          {
            id: data.scheduleId,
            name: data.scheduleName,
            completedAt: data.timestamp,
            success: false,
            error: data.error
          },
          ...prev.slice(0, 4)
        ]);
        
        showNotification(`Failed: ${data.scheduleName}`, "error");
        break;
        
      case "schedule:progress":
        setActiveExecutions(prev => ({
          ...prev,
          [data.scheduleId]: {
            ...prev[data.scheduleId],
            progress: data.progress,
            message: data.message
          }
        }));
        break;
    }
  };

  const showNotification = (message, type = "info") => {
    // Browser notification if permitted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("AnythingLLM Schedule", {
        body: message,
        icon: "/favicon.ico",
        tag: "schedule-notification"
      });
    }
  };

  const activeCount = Object.keys(activeExecutions).length;
  const hasActivity = activeCount > 0 || recentCompleted.length > 0;

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatDuration = (ms) => {
    if (!ms) return "";
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  // Bubble styled like Avatar/ConnectorBubble
  return (
    <>
      <div 
        className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: size, height: size }}
      >
        {/* Main Bubble - Matches Avatar/Connector style */}
        <div className={`
          w-full h-full rounded-full flex items-center justify-center
          ${hasActivity 
            ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
            : 'bg-gradient-to-br from-gray-400 to-gray-600'}
          text-white shadow-lg
          ring-2 ring-white dark:ring-gray-800
          hover:ring-4 hover:ring-blue-200 dark:hover:ring-blue-900
        `}>
          <Clock size={size * 0.5} weight="bold" />
        </div>
        
        {/* Status Badge - Active indicator */}
        {activeCount > 0 && (
          <div className="absolute -bottom-1 -right-1 flex items-center justify-center">
            <span className="absolute inline-flex h-4 w-4 rounded-full bg-green-400 opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white dark:border-gray-800 text-white text-xs font-bold items-center justify-center">
              {activeCount}
            </span>
          </div>
        )}
        
        {/* Hover Tooltip */}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          Background Tasks
          {activeCount > 0 && <span className="text-gray-400 ml-1">• {activeCount} running</span>}
        </div>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div ref={dropdownRef} className="absolute right-0 mt-2 w-96 bg-gray-800 rounded-lg shadow-2xl z-50 border border-gray-700 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" weight="bold" />
                Background Tasks
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Active Executions */}
            {activeCount > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Running Now</p>
                {Object.entries(activeExecutions).map(([id, execution]) => (
                  <div key={id} className="bg-gray-900 rounded-lg p-3 mb-2 border border-gray-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white flex items-center gap-2">
                        <CircleNotch className="w-4 h-4 text-green-500 animate-spin" />
                        {execution.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(execution.startedAt)}
                      </span>
                    </div>
                    {execution.progress && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${execution.progress}%` }}
                          ></div>
                        </div>
                        {execution.message && (
                          <p className="text-xs text-gray-400 mt-1">{execution.message}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recent Completed */}
            {recentCompleted.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Recent Completed</p>
                {recentCompleted.map((task, index) => (
                  <div key={`${task.id}-${index}`} className="bg-gray-900 rounded-lg p-3 mb-2 border border-gray-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white flex items-center gap-2">
                        {task.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" weight="fill" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" weight="fill" />
                        )}
                        {task.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(task.completedAt)}
                        {task.duration && ` (${formatDuration(task.duration)})`}
                      </span>
                    </div>
                    {task.result && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {task.result}
                      </p>
                    )}
                    {task.error && (
                      <p className="text-xs text-red-400 mt-1 line-clamp-2">
                        Error: {task.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Scheduled Tasks */}
            {schedules.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Scheduled ({schedules.filter(s => s.enabled).length} active)
                </p>
                {schedules.slice(0, 5).map((schedule) => (
                  <div key={schedule.id} className="bg-gray-900 rounded-lg p-3 mb-2 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{schedule.name}</span>
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full
                        ${schedule.enabled 
                          ? 'bg-green-900/50 text-green-400' 
                          : 'bg-gray-700 text-gray-400'}
                      `}>
                        {schedule.enabled ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {schedule.cron_expression} • Next: {schedule.next_run_at ? new Date(schedule.next_run_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                ))}
                {schedules.length > 5 && (
                  <button className="text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors">
                    View all {schedules.length} schedules →
                  </button>
                )}
              </div>
            )}

            {/* Empty State */}
            {!hasActivity && schedules.length === 0 && (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" weight="thin" />
                <p className="text-gray-400 mb-1">No scheduled tasks</p>
                <p className="text-xs text-gray-500">
                  Ask the agent to schedule a task for you
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}