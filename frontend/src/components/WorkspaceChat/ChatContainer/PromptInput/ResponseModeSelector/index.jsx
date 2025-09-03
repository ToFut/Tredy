import React, { useState, useRef, useEffect } from "react";
import { CaretDown, At, ChatCircle } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import { useTranslation } from "react-i18next";

export default function ResponseModeSelector({ 
  responseMode = "agent", 
  setResponseMode,
  showing,
  setShowing 
}) {
  const { t } = useTranslation();
  const dropdownRef = useRef(null);

  const modes = [
    {
      id: "agent",
      label: "Agent",
      icon: At,
      description: "AI agent with tools and enhanced capabilities",
      color: "text-blue-400"
    },
    {
      id: "regular", 
      label: "Regular",
      icon: ChatCircle,
      description: "Standard chat response",
      color: "text-gray-400"
    }
  ];

  const currentMode = modes.find(mode => mode.id === responseMode) || modes[0];

  useEffect(() => {
    function listenForOutsideClick() {
      if (!showing || !dropdownRef.current) return false;
      document.addEventListener("click", closeIfOutside);
    }
    listenForOutsideClick();
  }, [showing, dropdownRef.current]);

  const closeIfOutside = ({ target }) => {
    if (target.id === "response-mode-btn") return;
    const isOutside = !dropdownRef?.current?.contains(target);
    if (!isOutside) return;
    setShowing(false);
  };

  const handleModeSelect = (modeId) => {
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
            className={`w-3 h-3 text-theme-text-secondary transition-transform duration-200 ${showing ? 'rotate-180' : ''}`}
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
        <div className="absolute bottom-[80px] left-4 z-20">
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
                    isSelected ? 'bg-theme-action-menu-item-hover' : ''
                  }`}
                >
                  <ModeIcon
                    className={`w-5 h-5 mt-0.5 ${mode.color}`}
                    weight="fill"
                  />
                  <div className="flex flex-col items-start text-left">
                    <div className={`text-sm font-medium ${
                      isSelected ? 'text-theme-button-cta' : 'text-theme-text-primary'
                    }`}>
                      {mode.label}
                      {isSelected && (
                        <span className="ml-2 text-xs text-theme-button-cta">✓</span>
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
  const [responseMode, setResponseMode] = useState("agent"); // Default to agent
  const [showModeSelector, setShowModeSelector] = useState(false);
  return { responseMode, setResponseMode, showModeSelector, setShowModeSelector };
}