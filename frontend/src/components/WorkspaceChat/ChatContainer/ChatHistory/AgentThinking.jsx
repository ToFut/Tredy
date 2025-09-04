import React, { useState, useEffect } from "react";
import { Check, Loader2, Circle } from "lucide-react";

const thinkingSteps = [
  { id: 1, text: "Understanding your request", duration: 800 },
  { id: 2, text: "Searching through project files", duration: 1200 },
  { id: 3, text: "Analyzing code patterns", duration: 1500 },
  { id: 4, text: "Preparing response", duration: 600 }
];

export default function AgentThinking({ agentName = "agent", onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [dots, setDots] = useState("");
  const [isExiting, setIsExiting] = useState(false);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Progress through steps
  useEffect(() => {
    let timeoutId;
    
    if (currentStep < thinkingSteps.length) {
      const step = thinkingSteps[currentStep];
      timeoutId = setTimeout(() => {
        setCompletedSteps(prev => [...prev, step.id]);
        setCurrentStep(prev => prev + 1);
      }, step.duration);
    } else if (currentStep === thinkingSteps.length && !isExiting) {
      // All steps complete, start exit animation
      timeoutId = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 200);
      }, 300);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentStep, isExiting, onComplete]);

  return (
    <div 
      className={`
        transition-all duration-200 ease-out
        ${isExiting ? 'opacity-0 scale-[0.98] -translate-y-1' : 'opacity-100 scale-100 translate-y-0'}
      `}
    >
      <div className="my-3 mx-2">
        <div className="
          bg-slate-800/50 backdrop-blur-md 
          border border-slate-700/50 
          rounded-xl p-4 
          shadow-lg shadow-black/10
        ">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-white">
              Thinking{dots}
            </span>
            <span className="text-xs text-slate-500">
              @{agentName}
            </span>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {thinkingSteps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = index === currentStep;
              const isPending = index > currentStep;

              return (
                <div 
                  key={step.id}
                  className={`
                    flex items-center gap-2 text-sm
                    transition-all duration-300 ease-out
                    ${isPending ? 'opacity-0' : 'opacity-100'}
                    ${isCurrent ? 'translate-x-0' : 'translate-x-0'}
                  `}
                  style={{
                    transitionDelay: `${index * 100}ms`
                  }}
                >
                  {/* Status icon */}
                  <div className="flex-shrink-0 w-4 h-4">
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-green-400 animate-in fade-in zoom-in duration-200" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    ) : isPending ? (
                      <Circle className="w-4 h-4 text-slate-600" />
                    ) : null}
                  </div>

                  {/* Step text */}
                  <span className={`
                    transition-colors duration-200
                    ${isCompleted ? 'text-slate-500 line-through' : ''}
                    ${isCurrent ? 'text-white' : ''}
                    ${isPending ? 'text-slate-600' : ''}
                  `}>
                    {step.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Exit hint */}
          <div className="mt-3 pt-3 border-t border-slate-700/30">
            <span className="text-xs text-slate-500">
              Type /exit to leave agent mode
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}