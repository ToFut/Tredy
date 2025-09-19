import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Circle,
  Loader,
  ChevronRight,
  Brain,
  Search,
  Code,
  Sparkles,
} from "lucide-react";

const statusSteps = [
  { id: "analyzing", label: "Analyzing your request", icon: Brain },
  { id: "searching", label: "Searching relevant information", icon: Search },
  { id: "gathering", label: "Gathering context", icon: Code },
  { id: "working", label: "Working on your task", icon: Sparkles },
  { id: "preparing", label: "Preparing response", icon: ChevronRight },
];

const thinkingSteps = [
  "Understanding your request",
  "Analyzing patterns",
  "Building context",
  "Generating response",
];

export default function AgentStatus({ status, agentName = "agent", onExit }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [expandedView, setExpandedView] = useState(false);
  const [currentThought, setCurrentThought] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState("");

  // Simulate progressive status updates
  useEffect(() => {
    if (status === "active") {
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < statusSteps.length - 1) {
            // Mark previous step as completed
            setCompletedSteps((completed) => [
              ...completed,
              statusSteps[prev].id,
            ]);
            return prev + 1;
          }
          return prev;
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [status]);

  // Cycle through thinking steps
  useEffect(() => {
    if (status === "active" && currentStep === statusSteps.length - 1) {
      const thoughtInterval = setInterval(() => {
        setCurrentThought((prev) => (prev + 1) % thinkingSteps.length);
      }, 1500);

      return () => clearInterval(thoughtInterval);
    }
  }, [status, currentStep]);

  // Typing animation for current step
  useEffect(() => {
    if (status === "active" && currentStep < statusSteps.length) {
      const fullText = statusSteps[currentStep].label;
      let charIndex = 0;
      setTypedText("");
      setIsTyping(true);

      const typeInterval = setInterval(() => {
        if (charIndex < fullText.length) {
          setTypedText((prev) => prev + fullText[charIndex]);
          charIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typeInterval);
        }
      }, 30);

      return () => clearInterval(typeInterval);
    }
  }, [currentStep, status]);

  if (status === "inactive") return null;

  return (
    <div className="relative my-4 animate-fadeIn">
      <div
        className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 
                      backdrop-blur-xl rounded-2xl border border-white/10 p-6 
                      shadow-2xl shadow-black/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 
                            rounded-full flex items-center justify-center shadow-lg"
              >
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 
                            rounded-full animate-pulse border-2 border-gray-800"
              />
            </div>
            <div>
              <h3 className="text-white font-semibold">
                Agent @{agentName}
                <span className="text-xs ml-2 text-green-400 font-normal">
                  ● Active
                </span>
              </h3>
              <p className="text-gray-400 text-xs mt-0.5">
                Swapping to agent chat • Type /exit to leave
              </p>
            </div>
          </div>

          <button
            onClick={() => setExpandedView(!expandedView)}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <ChevronRight
              className={`w-4 h-4 transform transition-transform ${expandedView ? "rotate-90" : ""}`}
            />
          </button>
        </div>

        {/* Main Progress */}
        <div className="space-y-3 mb-4">
          {statusSteps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div
                key={step.id}
                className={`
                transition-all duration-500 transform
                ${isCurrent ? "scale-[1.02]" : ""}
                ${isPending ? "opacity-40" : "opacity-100"}
              `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`
                    relative flex items-center justify-center w-8 h-8 rounded-full
                    transition-all duration-500
                    ${isCompleted ? "bg-green-500/20 border border-green-500/50" : ""}
                    ${isCurrent ? "bg-blue-500/20 border border-blue-500/50" : ""}
                    ${isPending ? "bg-gray-700/30 border border-gray-600/30" : ""}
                  `}
                  >
                    {isCompleted && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                    {isCurrent && (
                      <Loader className="w-4 h-4 text-blue-400 animate-spin" />
                    )}
                    {isPending && <Circle className="w-4 h-4 text-gray-500" />}
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    <StepIcon
                      className={`
                      w-4 h-4 transition-colors
                      ${isCompleted ? "text-green-400" : ""}
                      ${isCurrent ? "text-blue-400" : ""}
                      ${isPending ? "text-gray-500" : ""}
                    `}
                    />
                    <span
                      className={`
                      text-sm transition-colors
                      ${isCompleted ? "text-green-400" : ""}
                      ${isCurrent ? "text-white" : ""}
                      ${isPending ? "text-gray-500" : ""}
                    `}
                    >
                      {isCurrent
                        ? isTyping
                          ? typedText
                          : step.label
                        : step.label}
                      {isCurrent && isTyping && (
                        <span className="inline-block w-0.5 h-3 bg-blue-400 ml-0.5 animate-pulse" />
                      )}
                    </span>
                  </div>

                  {isCompleted && (
                    <span className="text-xs text-green-400 opacity-70">✓</span>
                  )}
                </div>

                {/* Progress line to next step */}
                {index < statusSteps.length - 1 && (
                  <div
                    className="ml-4 mt-1 mb-1 w-0.5 h-4 bg-gradient-to-b 
                                from-gray-600/30 to-transparent"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Expanded thinking view */}
        {expandedView && currentStep === statusSteps.length - 1 && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="italic">
                {thinkingSteps[currentThought]}
                <span className="inline-flex ml-1">
                  <span className="animate-bounce delay-0 text-purple-400">
                    .
                  </span>
                  <span className="animate-bounce delay-100 text-purple-400">
                    .
                  </span>
                  <span className="animate-bounce delay-200 text-purple-400">
                    .
                  </span>
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Footer action */}
        {onExit && (
          <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
            <button
              onClick={onExit}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 
                       hover:bg-red-500/20 transition-all duration-200 
                       border border-red-500/20 hover:border-red-500/40"
            >
              Exit Agent Mode
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
