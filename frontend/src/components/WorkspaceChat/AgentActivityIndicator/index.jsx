import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Sparkles, 
  Code, 
  Search, 
  FileText, 
  Globe,
  Calendar,
  Mail,
  Database,
  Zap,
  Activity
} from 'lucide-react';

const agentIcons = {
  'web-search': Globe,
  'code-writer': Code,
  'document-analyzer': FileText,
  'web-browser': Search,
  'scheduler': Calendar,
  'email-handler': Mail,
  'database-query': Database,
  'task-planner': Brain,
  'default': Sparkles
};

const agentColors = {
  'web-search': 'from-blue-500 to-cyan-500',
  'code-writer': 'from-purple-500 to-pink-500',
  'document-analyzer': 'from-green-500 to-emerald-500',
  'web-browser': 'from-orange-500 to-yellow-500',
  'scheduler': 'from-indigo-500 to-purple-500',
  'email-handler': 'from-red-500 to-pink-500',
  'database-query': 'from-gray-600 to-gray-800',
  'task-planner': 'from-violet-500 to-purple-600',
  'default': 'from-slate-500 to-slate-700'
};

export default function AgentActivityIndicator({ activeAgents = [], thinking = false }) {
  const [expandedView, setExpandedView] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (activeAgents.length > 0) {
      setPulseAnimation(true);
      navigator.vibrate?.([20, 10, 20]); // Subtle haptic pattern
      setTimeout(() => setPulseAnimation(false), 600);
    }
  }, [activeAgents.length]);

  const handleTouch = () => {
    navigator.vibrate?.([10]);
    setExpandedView(!expandedView);
  };

  if (activeAgents.length === 0 && !thinking) return null;

  return (
    <>
      {/* Floating Agent Counter Badge */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed top-20 right-4 z-50 touch-none select-none"
        onTouchStart={handleTouch}
        onClick={handleTouch}
      >
        <motion.div
          animate={pulseAnimation ? { scale: [1, 1.2, 1] } : {}}
          className={`
            relative bg-black/80 backdrop-blur-xl rounded-full 
            border border-white/20 shadow-2xl cursor-pointer
            min-w-[56px] min-h-[56px] flex items-center justify-center
            active:scale-95 transition-transform
          `}
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl animate-pulse" />
          
          {/* Agent Count */}
          <div className="relative flex items-center gap-2 px-4">
            <Activity className="w-5 h-5 text-white animate-pulse" />
            <span className="text-white font-bold text-lg">
              {activeAgents.length}
            </span>
            {thinking && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
            )}
          </div>

          {/* Status Dots */}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
            {activeAgents.slice(0, 3).map((agent, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`w-2 h-2 rounded-full bg-gradient-to-r ${agentColors[agent.type] || agentColors.default}`}
              />
            ))}
            {activeAgents.length > 3 && (
              <div className="w-2 h-2 rounded-full bg-white/40" />
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Expanded Agent Details */}
      <AnimatePresence>
        {expandedView && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="fixed top-32 right-4 z-40 touch-none select-none"
          >
            <div className="bg-black/90 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl p-4 min-w-[280px]">
              <div className="text-white/60 text-xs font-medium mb-3 flex items-center gap-2">
                <Zap className="w-3 h-3" />
                ACTIVE AGENTS
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
                {activeAgents.map((agent, index) => {
                  const Icon = agentIcons[agent.type] || agentIcons.default;
                  return (
                    <motion.div
                      key={agent.id || index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${agentColors[agent.type] || agentColors.default}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">
                          {agent.name || agent.type}
                        </div>
                        <div className="text-white/40 text-xs">
                          {agent.status || 'Processing...'}
                        </div>
                      </div>
                      {agent.progress !== undefined && (
                        <div className="w-12 h-12 relative">
                          <svg className="transform -rotate-90 w-12 h-12">
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="3"
                              fill="none"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="url(#gradient)"
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 20}`}
                              strokeDashoffset={`${2 * Math.PI * 20 * (1 - agent.progress / 100)}`}
                              className="transition-all duration-300"
                            />
                            <defs>
                              <linearGradient id="gradient">
                                <stop offset="0%" stopColor="#3B82F6" />
                                <stop offset="100%" stopColor="#8B5CF6" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                            {agent.progress}%
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.vibrate?.([10]);
                  setExpandedView(false);
                }}
                className="mt-3 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/60 text-sm font-medium transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}