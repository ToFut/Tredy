import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Image, FileText, Video, TrendingUp } from '@phosphor-icons/react';

const ContentPlanningResult = ({ userName = "John" }) => {
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const analysisSteps = [
    { text: "Brand voice identified", icon: "🎯" },
    { text: "Target audience analyzed", icon: "👥" },
    { text: "Content themes generated", icon: "💡" },
    { text: "Optimal posting times calculated", icon: "⏰" }
  ];

  const contentPlan = [
    {
      day: "Monday",
      posts: [
        { time: "9:00 AM", platform: "LinkedIn", type: "article", title: "Thought leadership article about industry trends", icon: <FileText size={16} /> },
        { time: "6:00 PM", platform: "Instagram", type: "reel", title: "Behind-the-scenes reel with trending audio", icon: <Video size={16} /> }
      ]
    },
    {
      day: "Tuesday", 
      posts: [
        { time: "12:00 PM", platform: "Facebook", type: "carousel", title: "Customer success story with carousel images", icon: <Image size={16} /> },
        { time: "5:00 PM", platform: "Instagram", type: "post", title: "Product showcase with professional graphics", icon: <Image size={16} /> }
      ]
    },
    {
      day: "Wednesday",
      posts: [
        { time: "10:00 AM", platform: "LinkedIn", type: "post", title: "Team spotlight featuring your latest achievements", icon: <TrendingUp size={16} /> },
        { time: "7:00 PM", platform: "Instagram", type: "story", title: "Interactive Q&A session", icon: <Video size={16} /> }
      ]
    },
    {
      day: "Thursday",
      posts: [
        { time: "11:00 AM", platform: "Facebook", type: "infographic", title: "Educational infographic about your services", icon: <Image size={16} /> },
        { time: "4:00 PM", platform: "LinkedIn", type: "post", title: "Industry insights with data visualization", icon: <FileText size={16} /> }
      ]
    },
    {
      day: "Friday",
      posts: [
        { time: "9:00 AM", platform: "Instagram", type: "reel", title: "TGIF engaging reel to boost weekend engagement", icon: <Video size={16} /> },
        { time: "2:00 PM", platform: "Facebook", type: "post", title: "Week recap and community appreciation post", icon: <FileText size={16} /> }
      ]
    }
  ];

  useEffect(() => {
    // Simulate analysis steps
    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => {
        if (prev < analysisSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          setTimeout(() => setShowResults(true), 1000);
          return prev;
        }
      });
    }, 800);

    return () => clearInterval(stepInterval);
  }, []);

  const getPlatformColor = (platform) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'instagram': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case 'facebook': return 'text-blue-300 bg-blue-300/10 border-blue-300/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  if (!showResults) {
    return (
      <div className="flex flex-col gap-4 p-6 bg-theme-bg-secondary rounded-lg border border-theme-modal-border">
        <h3 className="text-xl font-semibold text-white mb-4">🎯 Analyzing your business...</h3>
        
        <div className="space-y-3">
          {analysisSteps.map((step, index) => (
            <div key={index} className={`flex items-center gap-3 transition-all duration-500 ${
              index <= analysisStep ? 'opacity-100' : 'opacity-30'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                index <= analysisStep 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-600 text-gray-400'
              }`}>
                {index <= analysisStep ? '✅' : step.icon}
              </div>
              <span className={`transition-all duration-300 ${
                index <= analysisStep ? 'text-white' : 'text-gray-400'
              }`}>
                {step.text}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex items-center gap-2 text-blue-400">
          <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
          <span className="text-sm">Processing your data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 bg-theme-bg-secondary rounded-lg border border-theme-modal-border">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          🎉 **Great news, {userName}!**
        </h2>
        <p className="text-green-400 text-lg">
          I've created 10 beautiful posts for you to publish this week across LinkedIn, Instagram, and Facebook!
        </p>
      </div>

      <div className="bg-theme-bg-primary rounded-lg p-4 border border-theme-modal-border">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar size={20} />
          This Week's Content Calendar
        </h3>
        
        <div className="space-y-4">
          {contentPlan.map((day, dayIndex) => (
            <div key={dayIndex} className="border border-gray-600/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 text-lg">{day.day}</h4>
              
              <div className="space-y-3">
                {day.posts.map((post, postIndex) => (
                  <div key={postIndex} className="flex items-center gap-3 p-3 bg-theme-bg-secondary rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-300 font-mono">{post.time}</span>
                    </div>
                    
                    <div className={`px-2 py-1 rounded text-xs font-medium border ${getPlatformColor(post.platform)}`}>
                      {post.platform}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {post.icon}
                      <span className="text-sm text-white truncate">{post.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          Preview Content
        </button>
        <button className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
          Schedule Everything
        </button>
      </div>
    </div>
  );
};

export default ContentPlanningResult;