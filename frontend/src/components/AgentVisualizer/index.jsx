import React, { useState, useEffect } from "react";
import { Brain, Code, Search, FileText, CheckCircle, Warning, Cpu } from "@phosphor-icons/react";

export default function AgentVisualizer({ status, operations = [], thinking = false }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (thinking) {
      const interval = setInterval(() => {
        setParticles(prev => [...prev.slice(-5), { id: Date.now(), x: Math.random() * 100, y: Math.random() * 100 }]);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [thinking]);

  const getStepIcon = (type) => {
    switch (type) {
      case 'thinking': return <Brain className="w-5 h-5" />;
      case 'coding': return <Code className="w-5 h-5" />;
      case 'searching': return <Search className="w-5 h-5" />;
      case 'analyzing': return <FileText className="w-5 h-5" />;
      case 'processing': return <Cpu className="w-5 h-5" />;
      case 'complete': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <Warning className="w-5 h-5" />;
      default: return <Cpu className="w-5 h-5" />;
    }
  };

  const getStepColor = (type) => {
    switch (type) {
      case 'thinking': return 'from-purple-500 to-pink-500';
      case 'coding': return 'from-blue-500 to-cyan-500';
      case 'searching': return 'from-amber-500 to-orange-500';
      case 'analyzing': return 'from-emerald-500 to-teal-500';
      case 'processing': return 'from-indigo-500 to-purple-500';
      case 'complete': return 'from-green-500 to-emerald-500';
      case 'error': return 'from-red-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="fixed top-20 right-4 w-80 z-40">
      <div className="glass-card rounded-2xl p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getStepColor(status)} flex items-center justify-center text-white intelligence-glow`}>
              {getStepIcon(status)}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Agent Processing</h3>
              <p className="text-xs text-gray-400 capitalize">{status || 'Idle'}</p>
            </div>
          </div>
          {thinking && (
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        {/* Process Steps */}
        {operations.length > 0 && (
          <div className="space-y-2">
            {operations.map((op, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                  index === currentStep ? 'bg-white/10' : 'bg-white/5'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getStepColor(op.type)} flex items-center justify-center text-white text-xs ${
                  op.status === 'active' ? 'intelligence-glow' : ''
                }`}>
                  {op.status === 'complete' ? '✓' : op.status === 'error' ? '!' : index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white font-medium">{op.name}</p>
                  {op.detail && <p className="text-xs text-gray-400">{op.detail}</p>}
                </div>
                {op.status === 'active' && (
                  <div className="thinking-indicator w-16 h-1 rounded-full bg-white/10" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Particles Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-60"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                animation: 'particle-float 3s ease-out forwards'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}