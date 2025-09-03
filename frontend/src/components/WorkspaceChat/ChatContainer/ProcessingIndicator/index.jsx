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
      {/* Compact Mobile View */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getModeIcon()}
            <span className="text-sm font-medium text-theme-text-primary">
              {activeStages[animatedStage]}
            </span>
          </div>
          <span className="text-xs text-theme-text-secondary">
            {animatedStage + 1}/{activeStages.length}
          </span>
        </div>
        <div className="w-full bg-theme-bg-secondary rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-theme-button-cta to-blue-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
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
        <div className="mt-2 text-center">
          <span className="text-xs text-theme-text-secondary animate-pulse">
            Almost there... ✨
          </span>
        </div>
      )}
    </div>
  );
}