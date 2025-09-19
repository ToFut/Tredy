import React, { useState, useEffect } from "react";
import {
  Lightning,
  Database,
  Globe,
  ChartLine,
  Sparkle,
  ArrowsClockwise,
} from "@phosphor-icons/react";

export default function IntelligenceCards({
  metrics = {},
  insights = [],
  isProcessing = false,
}) {
  if (!metrics || Object.keys(metrics).length === 0) {
    return null; // Don't render if no metrics
  }

  const [expandedCard, setExpandedCard] = useState(null);
  const [animatedValue, setAnimatedValue] = useState({});
  const [realtimeMetrics, setRealtimeMetrics] = useState(metrics);

  useEffect(() => {
    // Animate metric values
    Object.keys(metrics).forEach((key) => {
      const target = metrics[key];
      let current = animatedValue[key] || 0;
      const interval = setInterval(() => {
        if (current < target) {
          current += Math.ceil((target - current) / 10);
          setAnimatedValue((prev) => ({ ...prev, [key]: current }));
        }
      }, 50);
      return () => clearInterval(interval);
    });
  }, [metrics]);

  const cards = [
    {
      id: "performance",
      title: "Performance Metrics",
      icon: <Lightning className="w-5 h-5" />,
      gradient: "from-amber-500 to-orange-500",
      metrics: [
        { label: "Response Time", value: `${metrics.responseTime || 0}ms` },
        { label: "Tokens/Sec", value: metrics.tokensPerSec || 0 },
        { label: "Efficiency", value: `${metrics.efficiency || 0}%` },
      ],
    },
    {
      id: "context",
      title: "Context Analysis",
      icon: <Database className="w-5 h-5" />,
      gradient: "from-blue-500 to-cyan-500",
      metrics: [
        { label: "Documents", value: metrics.documents || 0 },
        { label: "Relevance", value: `${metrics.relevance || 0}%` },
        { label: "Coverage", value: `${metrics.coverage || 0}%` },
      ],
    },
    {
      id: "knowledge",
      title: "Knowledge Graph",
      icon: <Globe className="w-5 h-5" />,
      gradient: "from-purple-500 to-pink-500",
      metrics: [
        { label: "Entities", value: metrics.entities || 0 },
        { label: "Relations", value: metrics.relations || 0 },
        { label: "Confidence", value: `${metrics.confidence || 0}%` },
      ],
    },
    {
      id: "insights",
      title: "Real-time Insights",
      icon: <ChartLine className="w-5 h-5" />,
      gradient: "from-emerald-500 to-teal-500",
      content: insights,
    },
  ];

  return (
    <div className="fixed bottom-24 left-4 right-4 max-w-6xl mx-auto z-30">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() =>
              setExpandedCard(expandedCard === card.id ? null : card.id)
            }
            className={`glass-card rounded-xl p-4 cursor-pointer transition-all duration-300 ${
              expandedCard === card.id ? "col-span-2 row-span-2" : ""
            }`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-r ${card.gradient} flex items-center justify-center text-white`}
                >
                  {card.icon}
                </div>
                <h4 className="text-sm font-semibold text-white">
                  {card.title}
                </h4>
              </div>
              {isProcessing && card.id === "performance" && (
                <ArrowsClockwise className="w-4 h-4 text-white/60 animate-spin" />
              )}
            </div>

            {/* Card Content */}
            {card.metrics ? (
              <div
                className={`space-y-2 ${expandedCard === card.id ? "" : "space-y-1"}`}
              >
                {card.metrics.map((metric, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {metric.label}
                    </span>
                    <span
                      className={`text-sm font-mono text-white ${
                        expandedCard === card.id ? "text-lg" : ""
                      }`}
                    >
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : card.content ? (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {card.content
                  .slice(0, expandedCard === card.id ? 10 : 3)
                  .map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Sparkle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-300">{insight}</p>
                    </div>
                  ))}
              </div>
            ) : null}

            {/* Expanded View */}
            {expandedCard === card.id && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="h-32 bg-gradient-to-r from-white/5 to-white/10 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-2">
                    Visualization
                  </div>
                  <div className="flex items-end justify-between h-20 gap-1">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-white/20 to-transparent rounded-t"
                        style={{ height: `${Math.random() * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
