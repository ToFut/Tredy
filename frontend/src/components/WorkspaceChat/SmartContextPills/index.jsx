import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Stack as Layers, 
  Lightning as Zap, 
  TrendUp,
  Shield,
  Clock,
  ChatCircle as MessageSquare,
  Users,
  Trophy as Award,
  ChartBar as BarChart3,
  Sparkle as Sparkles
} from '@phosphor-icons/react';

export default function SmartContextPills({ 
  threadStats = {}, 
  workspace = {},
  performance = {}
}) {
  const [selectedPill, setSelectedPill] = useState(null);
  
  const pills = [
    {
      id: 'agents',
      icon: Users,
      label: 'Agents',
      value: threadStats.activeAgents || 0,
      color: 'from-purple-500 to-pink-500',
      detail: `${threadStats.totalAgentCalls || 0} total calls this session`,
      trend: threadStats.agentTrend || '+12%'
    },
    {
      id: 'complexity',
      icon: Layers,
      label: 'Complexity',
      value: threadStats.complexity || 'Medium',
      color: 'from-blue-500 to-cyan-500',
      detail: 'Based on context switches and tool usage',
      score: threadStats.complexityScore || 65
    },
    {
      id: 'tokens',
      icon: Zap,
      label: 'Tokens',
      value: `${(threadStats.tokensUsed || 0) / 1000}k`,
      color: 'from-yellow-500 to-orange-500',
      detail: `${threadStats.tokenLimit || 128}k limit`,
      percentage: ((threadStats.tokensUsed || 0) / (threadStats.tokenLimit || 128000)) * 100
    },
    {
      id: 'quality',
      icon: Award,
      label: 'Quality',
      value: performance.qualityScore || '98%',
      color: 'from-green-500 to-emerald-500',
      detail: 'Response accuracy and relevance',
      badge: performance.badge || 'Excellent'
    },
    {
      id: 'speed',
      icon: Clock,
      label: 'Speed',
      value: performance.avgResponseTime || '1.2s',
      color: 'from-indigo-500 to-purple-500',
      detail: 'Average response generation time',
      comparison: 'Faster than 89% of sessions'
    }
  ];

  const handlePillTouch = (pill) => {
    navigator.vibrate?.([10]);
    setSelectedPill(selectedPill?.id === pill.id ? null : pill);
  };

  return (
    <>
      {/* Horizontal Scrollable Pills */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2 -mx-4">
          {pills.map((pill, index) => {
            const Icon = pill.icon;
            return (
              <motion.div
                key={pill.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onTouchStart={() => handlePillTouch(pill)}
                onClick={() => handlePillTouch(pill)}
                className={`
                  flex-shrink-0 relative group cursor-pointer select-none
                  ${selectedPill?.id === pill.id ? 'z-10' : 'z-0'}
                `}
              >
                {/* Pill Container */}
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-full
                    bg-black/60 backdrop-blur-xl border border-white/10
                    transition-all duration-200
                    ${selectedPill?.id === pill.id ? 'ring-2 ring-white/30' : ''}
                  `}
                >
                  {/* Icon with Gradient Background */}
                  <div className={`p-1.5 rounded-full bg-gradient-to-r ${pill.color}`}>
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  
                  {/* Label and Value */}
                  <div className="flex flex-col">
                    <span className="text-white/60 text-[10px] font-medium leading-tight">
                      {pill.label}
                    </span>
                    <span className="text-white text-xs font-bold leading-tight">
                      {pill.value}
                    </span>
                  </div>

                  {/* Progress Indicator (if applicable) */}
                  {pill.percentage !== undefined && (
                    <div className="w-8 h-8 relative ml-1">
                      <svg className="transform -rotate-90 w-8 h-8">
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="2"
                          fill="none"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          stroke="url(#grad-${pill.id})"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 14}`}
                          strokeDashoffset={`${2 * Math.PI * 14 * (1 - pill.percentage / 100)}`}
                          className="transition-all duration-500"
                        />
                        <defs>
                          <linearGradient id={`grad-${pill.id}`}>
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#8B5CF6" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  )}

                  {/* Trend Indicator */}
                  {pill.trend && (
                    <div className="flex items-center gap-0.5 ml-1">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 text-[10px] font-bold">
                        {pill.trend}
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* Active Pulse Animation */}
                {pill.id === 'agents' && threadStats.activeAgents > 0 && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-pulse pointer-events-none" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Edge Fade Indicators */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none" />
      </div>

      {/* Expanded Detail View */}
      <AnimatePresence>
        {selectedPill && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 overflow-hidden"
          >
            <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-3 mt-2">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${selectedPill.color}`}>
                  <selectedPill.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm mb-1">
                    {selectedPill.label}
                  </div>
                  <div className="text-white/60 text-xs">
                    {selectedPill.detail}
                  </div>
                  {selectedPill.comparison && (
                    <div className="flex items-center gap-1 mt-2">
                      <BarChart3 className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 text-xs">
                        {selectedPill.comparison}
                      </span>
                    </div>
                  )}
                  {selectedPill.badge && (
                    <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-500/20 rounded-full">
                      <Sparkles className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 text-xs font-medium">
                        {selectedPill.badge}
                      </span>
                    </div>
                  )}
                </div>
                {selectedPill.score !== undefined && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {selectedPill.score}
                    </div>
                    <div className="text-xs text-white/40">Score</div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}