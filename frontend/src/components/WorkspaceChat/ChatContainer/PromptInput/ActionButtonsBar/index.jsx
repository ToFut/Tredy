import React from "react";
import { GameController, Microphone, Lightning, Brain } from "@phosphor-icons/react";
import SpeechToText from "../SpeechToText";
import SlashCommandsButton from "../SlashCommands";
import AvailableAgentsButton from "../AgentMenu";
import AttachItem from "../AttachItem";

export default function ActionButtonsBar({
  sendCommand,
  showSlashCommand,
  setShowSlashCommand,
  showAgents,
  setShowAgents,
  responseMode,
  setShowModeSelector,
  showModeSelector,
  isFocused,
  onGamifyClick,
  showGamifyMenu,
  onGamifyOption,
  compact = false
}) {
  const buttonBaseClass = compact 
    ? "p-1.5 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
    : "p-2 md:p-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation";

  const buttonSize = compact ? "w-4 h-4" : "w-5 h-5";

  return (
    <div className={`flex items-center gap-1 transition-all duration-300 ${
      isFocused && window.innerWidth < 640 && !compact
        ? 'scale-75 origin-left' 
        : ''
    }`}>
      {/* File Attachment */}
      <div className={buttonBaseClass}>
        <AttachItem compact={compact} />
      </div>

      {/* Slash Commands */}
      <SlashCommandsButton
        showing={showSlashCommand}
        setShowSlashCommand={setShowSlashCommand}
        compact={compact}
      />

      {/* Available Agents */}
      <AvailableAgentsButton
        showing={showAgents}
        setShowing={setShowAgents}
        compact={compact}
      />

      {/* Voice Recording */}
      <div className={`${buttonBaseClass} hover:bg-red-50 dark:hover:bg-red-900/20`}
           style={{ 
             minWidth: compact ? '32px' : '40px', 
             minHeight: compact ? '32px' : '40px' 
           }}>
        <SpeechToText sendCommand={sendCommand} />
      </div>

      {/* Gamify Button with Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={onGamifyClick}
          className={`${buttonBaseClass} hover:bg-gradient-to-r hover:from-green-100 hover:to-blue-100 dark:hover:from-green-900/30 dark:hover:to-blue-900/30 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 relative group ${
            showGamifyMenu ? 'bg-green-50 text-green-600' : ''
          }`}
          style={{ minWidth: compact ? '32px' : '36px', minHeight: compact ? '32px' : '36px' }}
          title="Gamify & Create - Interactive experiences and workflows"
        >
          <GameController className={`${buttonSize} relative z-10`} weight="bold" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </button>
        
        {/* Gamify Options Menu */}
        {showGamifyMenu && (
          <div className="absolute top-12 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50 min-w-48">
            <div className="space-y-1">
              <button
                onClick={() => onGamifyOption('interactive')}
                className="w-full text-left px-3 py-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded text-sm flex items-center gap-2"
              >
                <span className="text-green-600">🎮</span>
                <div>
                  <div className="font-medium">Interactive Learning</div>
                  <div className="text-xs text-gray-500">Add quizzes & challenges</div>
                </div>
              </button>
              
              <button
                onClick={() => onGamifyOption('workflow')}
                className="w-full text-left px-3 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded text-sm flex items-center gap-2"
              >
                <span className="text-purple-600">⚡</span>
                <div>
                  <div className="font-medium">Create Workflow</div>
                  <div className="text-xs text-gray-500">Build automated process</div>
                </div>
              </button>
              
              <button
                onClick={() => onGamifyOption('summary')}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-sm flex items-center gap-2"
              >
                <span className="text-blue-600">📝</span>
                <div>
                  <div className="font-medium">Smart Summary</div>
                  <div className="text-xs text-gray-500">Interactive overview</div>
                </div>
              </button>
              
              <button
                onClick={() => onGamifyOption('quiz')}
                className="w-full text-left px-3 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded text-sm flex items-center gap-2"
              >
                <span className="text-orange-600">🧠</span>
                <div>
                  <div className="font-medium">Generate Quiz</div>
                  <div className="text-xs text-gray-500">Test understanding</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Response Mode Toggle */}
      <button
        type="button"
        onClick={() => setShowModeSelector(!showModeSelector)}
        className={`${buttonBaseClass} transition-all touch-manipulation ${
          responseMode === "agent"
            ? "bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-600 dark:text-purple-400"
            : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
        }`}
        style={{ minWidth: compact ? '32px' : '36px', minHeight: compact ? '32px' : '36px' }}
        title={responseMode === "agent" ? "Agent Mode Active" : "Switch to Agent Mode"}
      >
        {responseMode === "agent" ? (
          <Brain className={buttonSize} weight="bold" />
        ) : (
          <Lightning className={buttonSize} />
        )}
      </button>
    </div>
  );
}