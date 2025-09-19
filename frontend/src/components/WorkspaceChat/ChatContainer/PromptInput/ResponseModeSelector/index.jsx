import React, { useState, useRef, useEffect } from "react";
import {
  CaretDown,
  At,
  ChatCircle,
  Sparkle,
  Brain,
} from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import { useTranslation } from "react-i18next";

export default function ResponseModeSelector({
  responseMode = "agent",
  setResponseMode,
  showing,
  setShowing,
}) {
  const { t } = useTranslation();
  const dropdownRef = useRef(null);

  const modes = [
    {
      id: "agent",
      label: "Agent Mode",
      icon: Brain,
      description: "Use AI agent with tools and functions",
      color: "text-purple-400",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      id: "chat",
      label: "Chat Mode",
      icon: ChatCircle,
      description: "Regular chat without agent tools",
      color: "text-blue-400",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "flow",
      label: "Flow Mode",
      icon: Sparkle,
      description: "Create and execute workflows",
      color: "text-green-400",
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  const currentMode =
    modes.find((mode) => mode.id === responseMode) || modes[0];

  useEffect(() => {
    if (!showing || !dropdownRef.current) return;

    function closeIfOutside(event) {
      // Check if click is on the button or its children
      const button = document.getElementById("response-mode-btn");
      if (button && button.contains(event.target)) return;

      const isOutside = !dropdownRef?.current?.contains(event.target);
      if (!isOutside) return;
      setShowing(false);
    }

    document.addEventListener("click", closeIfOutside);
    return () => document.removeEventListener("click", closeIfOutside);
  }, [showing]);

  const handleModeSelect = (modeId) => {
    console.log("handleModeSelect called with:", modeId);
    setResponseMode(modeId);
    setShowing(false);
  };

  const CurrentIcon = currentMode.icon;

  return (
    <>
      <div
        id="response-mode-btn"
        data-tooltip-id="tooltip-response-mode"
        data-tooltip-content={`Response Mode: ${currentMode.label}`}
        aria-label={`Response Mode: ${currentMode.label}`}
        onClick={() => setShowing(!showing)}
        className="flex justify-center items-center cursor-pointer relative"
      >
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-theme-bg-secondary hover:bg-theme-bg-chat transition-all duration-200 border border-theme-sidebar-border">
          <CurrentIcon
            className={`w-4 h-4 ${currentMode.color}`}
            weight="fill"
          />
          <span className="text-xs font-medium text-theme-text-primary">
            {currentMode.label}
          </span>
          <CaretDown
            className={`w-3 h-3 text-theme-text-secondary transition-transform duration-200 ${showing ? "rotate-180" : ""}`}
          />
        </div>
        <Tooltip
          id="tooltip-response-mode"
          place="top"
          delayShow={300}
          className="tooltip !text-xs z-99"
        />
      </div>

      {showing && (
        <div className="absolute bottom-[80px] left-4 z-50">
          <div
            ref={dropdownRef}
            className="w-64 p-2 bg-theme-action-menu-bg rounded-lg shadow-lg border border-theme-sidebar-border flex-col justify-start items-start gap-1 inline-flex"
          >
            {modes.map((mode) => {
              const ModeIcon = mode.icon;
              const isSelected = mode.id === responseMode;

              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeSelect(mode.id)}
                  className={`w-full p-3 rounded-lg flex items-start gap-3 hover:bg-theme-action-menu-item-hover transition-colors border-none cursor-pointer ${
                    isSelected ? "bg-theme-action-menu-item-hover" : ""
                  }`}
                >
                  <ModeIcon
                    className={`w-5 h-5 mt-0.5 ${mode.color}`}
                    weight="fill"
                  />
                  <div className="flex flex-col items-start text-left">
                    <div
                      className={`text-sm font-medium ${
                        isSelected
                          ? "text-theme-button-cta"
                          : "text-theme-text-primary"
                      }`}
                    >
                      {mode.label}
                      {isSelected && (
                        <span className="ml-2 text-xs text-theme-button-cta">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-theme-text-secondary mt-1">
                      {mode.description}
                    </div>
                  </div>
                </button>
              );
            })}
            <div className="w-full border-t border-theme-sidebar-border mt-2 pt-2">
              <div className="text-xs text-theme-text-secondary px-3">
                Agent mode provides enhanced capabilities with tool access
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function useResponseMode() {
  const [responseMode, setResponseMode] = useState("chat"); // Default to chat mode, not agent
  const [showModeSelector, setShowModeSelector] = useState(false);
  return {
    responseMode,
    setResponseMode,
    showModeSelector,
    setShowModeSelector,
  };
}
