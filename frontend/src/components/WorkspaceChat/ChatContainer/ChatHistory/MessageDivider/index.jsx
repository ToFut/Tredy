import React from "react";
import { Calendar, Clock } from "@phosphor-icons/react";

export default function MessageDivider({ date, isToday = false }) {
  const formatDate = (dateStr) => {
    const msgDate = new Date(dateStr);
    const today = new Date();
    
    if (isToday || msgDate.toDateString() === today.toDateString()) {
      return "Today";
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (msgDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    return msgDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex items-center justify-center py-4 px-4">
      <div className="flex items-center gap-2 px-3 py-1 bg-theme-bg-primary/50 rounded-full border border-white/5">
        <Calendar className="w-3 h-3 text-theme-text-secondary" />
        <span className="text-xs text-theme-text-secondary font-medium">
          {formatDate(date)}
        </span>
      </div>
    </div>
  );
}

export function SessionDivider({ sessionName, timestamp }) {
  return (
    <div className="flex items-center justify-center py-6 px-4">
      <div className="flex-1 h-px bg-white/10" />
      <div className="px-4 py-2 mx-4">
        <div className="text-center">
          <p className="text-sm font-medium text-theme-text-primary">
            {sessionName}
          </p>
          {timestamp && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-theme-text-secondary" />
              <span className="text-xs text-theme-text-secondary">
                {new Date(timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}