import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Zap,
  Globe,
  Shield,
  Brain,
  CheckCircle,
  Sparkles,
  ExternalLink,
  Code,
  Layers,
  Cpu,
} from "lucide-react";

export default function EmbeddedCapabilityDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showPointers, setShowPointers] = useState(false);
  const [activePointer, setActivePointer] = useState(0);

  const demoSteps = [
    {
      title: "Website Integration",
      description: "Embed Tredy AI directly into your existing website",
      website: "realestate.com",
      features: ["AI Chat Widget", "Lead Capture", "Property Assistant"],
    },
    {
      title: "Workflow Automation",
      description: "Connect your tools and automate complex processes",
      website: "crm.company.com",
      features: ["Auto Lead Processing", "Email Sequences", "Calendar Sync"],
    },
    {
      title: "Data Intelligence",
      description: "Transform your data into actionable insights",
      website: "analytics.business.com",
      features: ["Smart Reports", "Predictive Analytics", "ROI Tracking"],
    },
  ];

  const pointers = [
    {
      id: 0,
      position: { top: "15%", left: "5%" },
      direction: "right",
      content: "AI Widget Embedded",
      icon: <Brain className="w-4 h-4" />,
    },
    {
      id: 1,
      position: { top: "35%", right: "5%" },
      direction: "left",
      content: "Real-time Processing",
      icon: <Zap className="w-4 h-4" />,
    },
    {
      id: 2,
      position: { top: "55%", left: "5%" },
      direction: "right",
      content: "Smart Integrations",
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 3,
      position: { top: "75%", right: "5%" },
      direction: "left",
      content: "Your Workspace",
      icon: <Globe className="w-4 h-4" />,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % demoSteps.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const pointerInterval = setInterval(() => {
      setActivePointer((prev) => (prev + 1) % pointers.length);
    }, 1000);

    return () => clearInterval(pointerInterval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowPointers(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main Demo Container */}
      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-purple-200 hover:border-purple-300 transition-all duration-500">
        {/* Website Preview Header */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-4 border-b border-gray-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-lg border border-gray-300">
                <Globe className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {demoSteps[currentStep].website}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600 font-medium">
                Tredy Active
              </span>
            </div>
          </div>
        </div>

        {/* Website Content with Blur Effect */}
        <div className="relative">
          {/* Blurred Background Website */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 p-8 blur-sm opacity-60">
            <div className="space-y-6">
              {/* Mock Website Header */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>

              {/* Mock Content Blocks */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-2 bg-gray-100 rounded w-full mb-1"></div>
                  <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-2 bg-gray-100 rounded w-full mb-1"></div>
                  <div className="h-2 bg-gray-100 rounded w-2/3"></div>
                </div>
              </div>

              {/* Mock Sidebar */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-100 rounded w-full"></div>
                  <div className="h-2 bg-gray-100 rounded w-4/5"></div>
                  <div className="h-2 bg-gray-100 rounded w-3/5"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Tredy AI Widget - Clear and Focused */}
          <div className="relative z-10 p-8">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 shadow-2xl border-2 border-white/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      Tredy AI Assistant
                    </h3>
                    <p className="text-purple-100 text-sm">
                      Intelligent Business Automation
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-white/20 rounded-full px-3 py-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white text-xs font-medium">Live</span>
                </div>
              </div>

              {/* AI Response Preview */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm leading-relaxed">
                      I've analyzed your website and found{" "}
                      <span className="font-semibold">
                        3 automation opportunities
                      </span>{" "}
                      that could save you 15+ hours per week and increase
                      conversions by 200%.
                    </p>
                    <div className="flex items-center space-x-4 mt-3 text-xs text-purple-100">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Lead Processing</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Email Automation</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>CRM Sync</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    // Focus on chat input or trigger chat action
                    const chatInput = document.querySelector(
                      'textarea[placeholder*="Send a message"], textarea[placeholder*="Type your message"]'
                    );
                    if (chatInput) {
                      chatInput.focus();
                      chatInput.value =
                        "@agent analyze my website and provide automation recommendations";
                      chatInput.dispatchEvent(
                        new Event("input", { bubbles: true })
                      );
                    } else {
                      // If no chat input found, scroll to top and try to find it
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      setTimeout(() => {
                        const chatInput = document.querySelector(
                          'textarea[placeholder*="Send a message"], textarea[placeholder*="Type your message"]'
                        );
                        if (chatInput) {
                          chatInput.focus();
                          chatInput.value =
                            "@agent analyze my website and provide automation recommendations";
                          chatInput.dispatchEvent(
                            new Event("input", { bubbles: true })
                          );
                        }
                      }, 500);
                    }
                  }}
                  className="flex-1 bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-purple-50 transition-colors"
                >
                  View Analysis
                </button>
                <button className="px-4 py-2 bg-white/20 text-white rounded-lg font-semibold text-sm hover:bg-white/30 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* External Pointers */}
        {showPointers && (
          <div className="absolute inset-0 pointer-events-none">
            {pointers.map((pointer, index) => (
              <div
                key={pointer.id}
                className={`absolute transition-all duration-1000 ${
                  activePointer === index
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-75"
                }`}
                style={pointer.position}
              >
                <div
                  className={`flex items-center space-x-2 ${
                    pointer.direction === "right"
                      ? "flex-row"
                      : "flex-row-reverse"
                  }`}
                >
                  <div className="bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap">
                    {pointer.content}
                  </div>
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg">
                    {pointer.icon}
                  </div>
                </div>
                <div
                  className={`absolute top-1/2 w-0 h-0 border-8 ${
                    pointer.direction === "right"
                      ? "border-l-purple-600 border-t-transparent border-b-transparent border-r-transparent left-full -translate-y-1/2"
                      : "border-r-purple-600 border-t-transparent border-b-transparent border-l-transparent right-full -translate-y-1/2"
                  }`}
                ></div>
              </div>
            ))}
          </div>
        )}

        {/* Step Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
            {demoSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentStep === index ? "bg-purple-600 w-6" : "bg-gray-300"
                }`}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Your Tredy Workspace Section */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Your Tredy Workspace
              </h3>
              <p className="text-sm text-gray-600">
                Centralized AI command center
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">500+</div>
              <div className="text-xs text-gray-500">Integrations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">99.9%</div>
              <div className="text-xs text-gray-500">Uptime</div>
            </div>
            <button className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-2 rounded-lg font-semibold text-sm hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105">
              <ArrowRight className="w-4 h-4 inline mr-2" />
              Launch Workspace
            </button>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(147, 51, 234, 0.1);
          }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }
      `}</style>
    </div>
  );
}
