import React, { useEffect, useState } from 'react';
import { 
  CircleNotch, 
  CheckCircle, 
  Circle,
  Brain,
  MagnifyingGlass,
  PencilSimple,
  Sparkle
} from '@phosphor-icons/react';

export default function ProcessingIndicator({ 
  stages = [], 
  currentStage = 0,
  mode = 'default',
  visible = true 
}) {
  const [animatedStage, setAnimatedStage] = useState(currentStage);

  useEffect(() => {
    // Animate stage transitions
    const timer = setTimeout(() => {
      setAnimatedStage(currentStage);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStage]);

  if (!visible || stages.length === 0) return null;

  const defaultStages = [
    'Understanding request',
    'Processing information',
    'Generating response',
    'Formatting output'
  ];

  const modeStages = {
    research: [
      'Analyzing query',
      'Searching sources',
      'Gathering information',
      'Synthesizing findings',
      'Structuring report'
    ],
    create: [
      'Understanding requirements',
      'Planning structure',
      'Generating content',
      'Refining output',
      'Finalizing'
    ],
    analyze: [
      'Processing data',
      'Running analysis',
      'Identifying patterns',
      'Creating visualizations',
      'Preparing insights'
    ],
    smart: [
      'Analyzing request',
      'Selecting approach',
      'Executing tasks',
      'Optimizing results',
      'Preparing output'
    ]
  };

  const activeStages = stages.length > 0 ? stages : (modeStages[mode] || defaultStages);

  const getStageIcon = (index, isActive, isCompleted) => {
    if (isCompleted) {
      return <CheckCircle className="w-4 h-4" weight="fill" />;
    }
    if (isActive) {
      return <CircleNotch className="w-4 h-4 progress-icon spinner" weight="bold" />;
    }
    return <Circle className="w-4 h-4" weight="regular" />;
  };

  const getStageClass = (index) => {
    if (index < animatedStage) return 'completed';
    if (index === animatedStage) return 'active';
    return 'pending';
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'research': return <MagnifyingGlass className="w-5 h-5" />;
      case 'create': return <PencilSimple className="w-5 h-5" />;
      case 'analyze': return <Brain className="w-5 h-5" />;
      case 'smart': return <Sparkle className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const progressPercentage = ((animatedStage + 1) / activeStages.length) * 100;

  return (
    <div className="processing-indicator-wrapper mb-4">
      {/* Enhanced Agentic View */}
      <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200/50 overflow-hidden">
        {/* Animated background effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse" />
        </div>
        
        {/* Main content */}
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
                {getModeIcon()}
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">AI Processing</p>
                <p className="text-sm font-semibold text-gray-900">
                  {activeStages[animatedStage]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Step {animatedStage + 1} of {activeStages.length}
              </span>
              <Sparkle className="w-4 h-4 text-amber-500 animate-pulse" />
            </div>
          </div>

          {/* Progress steps with icons */}
          <div className="flex gap-2 mb-3">
            {activeStages.map((stage, index) => {
              const isActive = index === animatedStage;
              const isCompleted = index < animatedStage;
              
              return (
                <div
                  key={index}
                  className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
                    isActive ? 'bg-gradient-to-r from-blue-300 to-purple-300 animate-pulse' :
                    'bg-gray-200'
                  }`}
                />
              );
            })}
          </div>

          {/* Stage details */}
          <div className="grid grid-cols-5 gap-2 text-xs">
            {activeStages.map((stage, index) => {
              const isActive = index === animatedStage;
              const isCompleted = index < animatedStage;
              
              return (
                <div
                  key={index}
                  className={`text-center transition-all duration-300 ${
                    isCompleted ? 'opacity-50' :
                    isActive ? 'opacity-100 scale-105' :
                    'opacity-30'
                  }`}
                >
                  <div className={`w-6 h-6 mx-auto mb-1 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-100 text-green-600' :
                    isActive ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className="hidden lg:block truncate px-1">{stage}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compact Mobile View */}
      <div className="md:hidden">
        <div className="progress-stages">
          {activeStages.map((stage, index) => {
            const stageClass = getStageClass(index);
            const isActive = index === animatedStage;
            const isCompleted = index < animatedStage;
            
            return (
              <div key={index} className={`progress-stage ${stageClass}`}>
                <div className="progress-icon">
                  {getStageIcon(index, isActive, isCompleted)}
                </div>
                <span className="text-xs">{stage}</span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-3 px-4">
          <div className="w-full bg-theme-bg-secondary/50 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-theme-button-cta to-blue-400 h-1.5 rounded-full transition-all duration-500 relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                <div className="w-2 h-2 bg-theme-button-cta rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fun Loading Messages */}
      {animatedStage === activeStages.length - 1 && (
        <div className="mt-3 text-center animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-3 py-1 glass-effect rounded-full border border-theme-sidebar-border">
            <Sparkle className="w-3 h-3 text-purple-500 animate-pulse" />
            <span className="text-xs text-theme-text-primary font-medium">
              Almost there...
            </span>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}