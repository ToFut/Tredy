import React, { useState, useEffect } from "react";
import { FileText, Image, ChartBar, Table, Code, List, Sparkle, Download } from "@phosphor-icons/react";

export default function VisualSummary({ content = '', type = 'auto', onExport }) {
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (content && content.length > 0) {
      generateSummary();
    }
  }, [content]);

  const generateSummary = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setSummary({
        type: detectContentType(content),
        title: extractTitle(content),
        keyPoints: extractKeyPoints(content),
        visualData: generateVisualData(content),
        confidence: Math.floor(Math.random() * 20) + 80
      });
      setIsGenerating(false);
    }, 1500);
  };

  const detectContentType = (content) => {
    if (content.includes('```')) return 'code';
    if (content.includes('|') && content.includes('-')) return 'table';
    if (content.match(/\d+\.\s/)) return 'list';
    if (content.match(/https?:\/\//)) return 'links';
    return 'text';
  };

  const extractTitle = (content) => {
    const lines = content.split('\n');
    return lines[0].substring(0, 50) + (lines[0].length > 50 ? '...' : '');
  };

  const extractKeyPoints = (content) => {
    const points = [];
    const lines = content.split('\n').filter(l => l.trim());
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      if (lines[i].length > 20) {
        points.push(lines[i].substring(0, 100) + (lines[i].length > 100 ? '...' : ''));
      }
    }
    return points;
  };

  const generateVisualData = (content) => {
    return [...Array(6)].map(() => ({
      value: Math.floor(Math.random() * 100),
      label: `Data ${Math.floor(Math.random() * 100)}`
    }));
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'code': return <Code className="w-5 h-5" />;
      case 'table': return <Table className="w-5 h-5" />;
      case 'list': return <List className="w-5 h-5" />;
      case 'image': return <Image className="w-5 h-5" />;
      case 'chart': return <ChartBar className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeGradient = (type) => {
    switch (type) {
      case 'code': return 'from-blue-500 to-cyan-500';
      case 'table': return 'from-purple-500 to-pink-500';
      case 'list': return 'from-amber-500 to-orange-500';
      case 'chart': return 'from-emerald-500 to-teal-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (!summary && !isGenerating) return null;

  return (
    <div className="my-4 glass-card rounded-2xl p-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${getTypeGradient(summary?.type || 'text')} flex items-center justify-center text-white`}>
            {getTypeIcon(summary?.type || 'text')}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Visual Summary</h3>
            <p className="text-xs text-gray-400">
              {isGenerating ? 'Generating...' : `${summary?.type} • ${summary?.confidence}% confidence`}
            </p>
          </div>
        </div>
        {!isGenerating && (
          <button
            onClick={onExport}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Download className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Content */}
      {isGenerating ? (
        <div className="space-y-3">
          <div className="h-4 bg-white/10 rounded animate-pulse" />
          <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-white/10 rounded animate-pulse w-1/2" />
        </div>
      ) : summary && (
        <>
          {/* Title */}
          <div className="mb-3 p-3 bg-white/5 rounded-lg">
            <p className="text-sm text-white font-medium">{summary.title}</p>
          </div>

          {/* Key Points */}
          {summary.keyPoints.length > 0 && (
            <div className="mb-3 space-y-2">
              {summary.keyPoints.map((point, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Sparkle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-300">{point}</p>
                </div>
              ))}
            </div>
          )}

          {/* Visual Data */}
          <div className="p-3 bg-gradient-to-r from-white/5 to-white/10 rounded-lg">
            <div className="flex items-end justify-between h-20 gap-1">
              {summary.visualData.map((data, idx) => (
                <div
                  key={idx}
                  className="flex-1 relative group"
                >
                  <div
                    className="bg-gradient-to-t from-purple-500/50 to-transparent rounded-t transition-all hover:from-purple-500/70"
                    style={{ height: `${data.value}%` }}
                  />
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {data.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            <button className="flex-1 text-xs py-2 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
              Expand Details
            </button>
            <button className="flex-1 text-xs py-2 px-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-lg text-white transition-colors">
              Generate Report
            </button>
          </div>
        </>
      )}
    </div>
  );
}