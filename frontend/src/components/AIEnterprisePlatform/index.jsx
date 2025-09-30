import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkle,
  ChatCircle,
  Globe,
  Shield,
  Lightning,
  Users,
  Building,
  ArrowRight,
  Play,
  Pause,
  ArrowCounterClockwise,
  Eye,
  Code,
  Rocket,
  Palette,
} from "@phosphor-icons/react";

// Real Client Website Content
const DEMO_WEBSITE_CONTENT = {
  company: "Greenfield Construction",
  tagline: "Building Dreams Since 1985",
  description:
    "Family-owned construction company specializing in residential and commercial projects. Licensed, bonded, and insured.",
  features: [
    "Licensed & Insured",
    "Free Estimates",
    "Quality Guarantee",
    "Local References",
  ],
  stats: {
    projects: "150+",
    clients: "200+",
    years: "38",
    rating: "4.9★",
  },
  services: [
    "Residential Construction",
    "Commercial Renovations",
    "Kitchen & Bath Remodeling",
    "Custom Home Building",
  ],
  testimonials: [
    "Mike and his team did an amazing job on our kitchen remodel. Professional, on time, and within budget.",
    "We've used Greenfield for 3 projects now. Always reliable and great quality work.",
    "Best construction company in the area. Highly recommend!",
  ],
  contact: {
    phone: "(555) 123-4567",
    email: "info@greenfieldconstruction.com",
    address: "123 Main St, Springfield, IL 62701",
  },
};

// Demo Chat Messages - SMB Construction Business
const DEMO_CHAT_MESSAGES = [
  {
    id: 1,
    type: "user",
    message:
      "Hi! I'm interested in getting a quote for a kitchen remodel. Can you help me?",
    timestamp: "2:34 PM",
  },
  {
    id: 2,
    type: "assistant",
    message:
      "Hello! I'd be happy to help you with your kitchen remodel quote. Let me gather some information about your project and check our current availability.",
    timestamp: "2:34 PM",
    actions: [
      "Checking project calendar",
      "Analyzing similar projects",
      "Calculating material costs",
    ],
  },
  {
    id: 3,
    type: "assistant",
    message:
      "🏗️ **Kitchen Remodel Analysis Complete**\n\n**Based on your location and typical kitchen remodels:**\n• Estimated timeline: 4-6 weeks\n• Material cost range: $15,000-$25,000\n• Labor estimate: $8,000-$12,000\n• Next available start: March 15th\n\n**Popular upgrades in your area:**\n• Quartz countertops (+$3,000)\n• Custom cabinets (+$5,000)\n• Smart appliances (+$2,000)\n\nWould you like me to schedule a free consultation with our project manager?",
    timestamp: "2:35 PM",
    isAnalysis: true,
  },
  {
    id: 4,
    type: "user",
    message:
      "Yes, that sounds great! Can you also send me some photos of recent kitchen projects?",
    timestamp: "2:36 PM",
  },
  {
    id: 5,
    type: "assistant",
    message:
      "✅ **Consultation Scheduled & Portfolio Sent**\n\n**Your Consultation:**\n• Date: March 8th at 2:00 PM\n• Location: Your home (free in-home visit)\n• Duration: 1 hour\n• Project Manager: Mike Rodriguez\n\n**Portfolio Gallery:**\n• 12 recent kitchen remodels sent to your email\n• Before/after photos included\n• Material samples will be brought to consultation\n\n**Next Steps:**\n• Calendar invite sent to your email\n• Project questionnaire sent for pre-consultation\n• Material catalog will be emailed tomorrow\n\nI've also added you to our project tracking system - you'll get weekly updates automatically!",
    timestamp: "2:36 PM",
    isAction: true,
  },
];

// Compact Embedded Chat Component
function EmbeddedChat({ isActive, onToggle }) {
  const [messages, setMessages] = useState(DEMO_CHAT_MESSAGES.slice(0, 2));
  const [isTyping, setIsTyping] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(2);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isActive && currentMessageIndex < DEMO_CHAT_MESSAGES.length) {
      const timer = setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            DEMO_CHAT_MESSAGES[currentMessageIndex],
          ]);
          setCurrentMessageIndex((prev) => prev + 1);
          setIsTyping(false);
        }, 1500);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isActive, currentMessageIndex]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const resetDemo = () => {
    setMessages(DEMO_CHAT_MESSAGES.slice(0, 2));
    setCurrentMessageIndex(2);
    setIsTyping(false);
  };

  return (
    <div
      className={`fixed bottom-4 right-4 w-72 h-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 transform transition-all duration-300 ${
        isActive ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
            <ChatCircle className="w-3 h-3 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
              AI Assistant
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Powered by AnythingLLM
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={resetDemo}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Reset demo"
          >
            <ArrowCounterClockwise className="w-3 h-3 text-gray-500" />
          </button>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-56">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-2 rounded-lg text-xs ${
                msg.type === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
              }`}
            >
              <p>{msg.message}</p>
              {msg.isAnalysis && (
                <div className="mt-1 p-1.5 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkle className="w-2 h-2 text-green-600" />
                    <span className="text-xs font-medium text-green-800 dark:text-green-200">
                      AI Analysis
                    </span>
                  </div>
                </div>
              )}
              {msg.isAction && (
                <div className="mt-1 p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-1 mb-1">
                    <Lightning className="w-2 h-2 text-blue-600" />
                    <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                      Automated Actions
                    </span>
                  </div>
                </div>
              )}
              <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <div
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                <span className="text-xs text-gray-500 ml-1">
                  AI is analyzing...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask about your project..."
            className="flex-1 px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled
          />
          <button className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Component - Compact Design
export default function AIEnterprisePlatform({ className = "" }) {
  const [isChatActive, setIsChatActive] = useState(false);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);

  const toggleChat = () => {
    setIsChatActive(!isChatActive);
  };

  const startDemo = () => {
    setIsDemoPlaying(true);
    setIsChatActive(true);
  };

  return (
    <section
      className={`py-12 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/10 ${className}`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Modern Integration Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full mb-6 shadow-lg">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-pulse"></div>
            <Code className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">
              Easy Website Integration
            </span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            Embed AI Intelligence Into
            <span className="block text-purple-600 dark:text-purple-400">
              Your Website
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8 leading-relaxed">
            Transform your existing website into an intelligent business
            platform. Add Tredy AI with just one line of code and watch your
            conversions soar.
          </p>

          {/* Modern Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Works with any website
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                5-minute setup
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                No coding required
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Instant ROI
              </span>
            </div>
          </div>

          {/* Modern CTA Button */}
          <button
            onClick={startDemo}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 transform"
          >
            <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>See Live Integration Demo</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Modern Integration Steps */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-900/10 rounded-3xl p-8 shadow-2xl border border-purple-200/50 dark:border-purple-800/50 backdrop-blur-sm">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full mb-4">
                <Rocket className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                  4-Step Integration Process
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                From Zero to AI-Powered in Minutes
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Transform your website into an intelligent business platform
                with our simple integration process
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <Code className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg border-2 border-blue-500">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                      1
                    </span>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  Add One Line of Code
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Simply add our lightweight script to your website's head
                  section. Works with any platform.
                </p>
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <code className="text-xs text-gray-800 dark:text-gray-200">
                    &lt;script src="tredy.ai/widget.js"&gt;&lt;/script&gt;
                  </code>
                </div>
              </div>

              {/* Step 2 */}
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg border-2 border-purple-500">
                    <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">
                      2
                    </span>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  Configure Your Business
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Chat with Tredy to automatically build intelligent workflows
                  using your connectors and our advanced AI for complex task
                  automation and information generation.
                </p>
                <div className="mt-4 flex justify-center space-x-2">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      CRM
                    </span>
                  </div>
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-green-600 dark:text-green-400">
                      📅
                    </span>
                  </div>
                  <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      📧
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <Lightning className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg border-2 border-emerald-500">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      3
                    </span>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  AI Goes Live Instantly
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Your AI assistant starts handling leads, scheduling, and
                  customer inquiries immediately.
                </p>
                <div className="mt-4 flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <div
                    className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <Palette className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg border-2 border-orange-500">
                    <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                      4
                    </span>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  Design Your Chat Experience
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Customize your chat with supported languages, branding, logo,
                  instructions, and any design needs to match your business
                  perfectly.
                </p>
                <div className="mt-4 flex justify-center space-x-2">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      🌐
                    </span>
                  </div>
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-purple-600 dark:text-purple-400">
                      🎨
                    </span>
                  </div>
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-green-600 dark:text-green-400">
                      📝
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Demo with Pointers */}
        <div className="relative max-w-3xl mx-auto">
          {/* Background Blur Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100/60 to-blue-100/40 backdrop-blur-3xl rounded-3xl"></div>

          {/* Main Demo Container - Smaller */}
          <div className="relative bg-white/85 dark:bg-gray-800/85 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transform scale-90">
            {/* Tredy Integration Badge */}
            <div className="absolute top-4 right-4 z-30">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                Powered by Tredy AI
              </div>
            </div>
            {/* Compact Website Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 relative overflow-hidden backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-transparent backdrop-blur-sm"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {DEMO_WEBSITE_CONTENT.company}
                    </h3>
                    <p className="text-orange-100 text-xs font-medium">
                      {DEMO_WEBSITE_CONTENT.tagline}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-1 text-orange-100">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">
                      Call: {DEMO_WEBSITE_CONTENT.contact.phone}
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-all duration-300 hover:scale-105 shadow-lg text-sm">
                    Free Estimate
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Navigation */}
            <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100/50 px-4 py-2">
              <div className="flex items-center gap-6">
                {["Home", "Services", "Projects", "About", "Contact"].map(
                  (item, index) => (
                    <a
                      key={item}
                      href="#"
                      className={`text-xs font-medium transition-all duration-300 hover:text-orange-600 relative group ${
                        index === 0 ? "text-orange-600" : "text-gray-700"
                      }`}
                    >
                      {item}
                      <div
                        className={`absolute -bottom-1 left-0 w-full h-0.5 bg-orange-600 transition-all duration-300 ${
                          index === 0
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                      ></div>
                    </a>
                  )
                )}
              </div>
            </div>

            {/* Compact Website Content */}
            <div className="p-4 bg-gradient-to-br from-gray-50/80 to-white/80 backdrop-blur-sm">
              {/* Hero Section */}
              <div className="mb-8">
                <h4 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  Quality Construction Services You Can Trust
                </h4>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  {DEMO_WEBSITE_CONTENT.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {DEMO_WEBSITE_CONTENT.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100/50 hover:shadow-md hover:bg-white/90 transition-all duration-300"
                    >
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services Grid */}
              <div className="mb-8">
                <h5 className="text-xl font-bold text-gray-900 mb-4">
                  Our Services
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  {DEMO_WEBSITE_CONTENT.services.map((service, index) => (
                    <div
                      key={index}
                      className="group p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100/50 hover:border-orange-200/50 hover:shadow-lg hover:bg-white/90 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100/80 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:bg-orange-200/80 transition-colors">
                          <Building className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600 transition-colors">
                          {service}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats & Testimonials */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <h5 className="text-xl font-bold text-gray-900 mb-4">
                    Why Choose Us
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(DEMO_WEBSITE_CONTENT.stats).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="text-center p-4 bg-gradient-to-br from-orange-50/80 to-orange-100/80 backdrop-blur-sm rounded-xl border border-orange-200/50 hover:shadow-md hover:from-orange-50/90 hover:to-orange-100/90 transition-all duration-300"
                        >
                          <div className="text-2xl font-bold text-orange-600 mb-1">
                            {value}
                          </div>
                          <div className="text-xs text-gray-600 capitalize font-medium">
                            {key}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-xl font-bold text-gray-900 mb-4">
                    What Our Clients Say
                  </h5>
                  <div className="space-y-3">
                    {DEMO_WEBSITE_CONTENT.testimonials
                      .slice(0, 2)
                      .map((testimonial, index) => (
                        <div
                          key={index}
                          className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100/50 shadow-sm hover:shadow-md hover:bg-white/90 transition-all duration-300"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className="text-sm">
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 italic leading-relaxed">
                            "{testimonial}"
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Premium Contact CTA */}
              <div className="bg-gradient-to-r from-orange-50/80 to-orange-100/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xl font-bold text-gray-900 mb-2">
                      Ready to Start Your Project?
                    </h5>
                    <p className="text-gray-600 mb-3">
                      Get a free estimate today. Call{" "}
                      {DEMO_WEBSITE_CONTENT.contact.phone}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="text-orange-500">📧</span>
                        {DEMO_WEBSITE_CONTENT.contact.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-orange-500">📍</span>
                        {DEMO_WEBSITE_CONTENT.contact.address}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all duration-300 hover:scale-105 shadow-lg">
                      Call Now
                    </button>
                    <button
                      onClick={toggleChat}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-orange-600 border border-orange-300 rounded-xl font-semibold hover:bg-orange-50 transition-all duration-300 hover:scale-105 shadow-sm"
                    >
                      <ChatCircle className="w-4 h-4" />
                      <span>Chat Online</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Elegant Chat Button */}
            <div className="absolute bottom-6 right-6">
              <button
                onClick={toggleChat}
                className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
              >
                <ChatCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </button>
            </div>
          </div>

          {/* Directional Arrows and Labels */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Your Website Label */}
            <div className="absolute top-8 left-8 z-40">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-800">
                    Your Website
                  </span>
                </div>
              </div>
              <div className="absolute top-12 left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
            </div>

            {/* Tredy Chat Label */}
            <div className="absolute bottom-20 right-20 z-40">
              <div className="bg-gradient-to-r from-blue-500/95 to-purple-500/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg text-white">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  <span className="text-sm font-semibold">Tredy AI Chat</span>
                </div>
              </div>
              <div className="absolute bottom-12 right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-500/95"></div>
            </div>

            {/* Arrow from Website to Chat */}
            <div className="absolute bottom-32 right-32 z-30">
              <div className="flex items-center gap-2">
                <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <div className="w-0 h-0 border-l-4 border-r-0 border-t-2 border-b-2 border-transparent border-l-purple-500"></div>
              </div>
            </div>

            {/* Tredy Workspace Label */}
            <div className="absolute top-1/2 left-4 z-40">
              <div className="bg-gradient-to-r from-purple-500/95 to-pink-500/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg text-white">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  <span className="text-sm font-semibold">Tredy Workspace</span>
                </div>
                <div className="text-xs text-purple-100 mt-1">
                  All your business data
                </div>
              </div>
              <div className="absolute top-12 left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-500/95"></div>
            </div>

            {/* Arrow from Website to Workspace */}
            <div className="absolute top-1/2 left-16 z-30">
              <div className="flex items-center gap-2">
                <div className="w-0 h-0 border-r-4 border-t-2 border-b-2 border-l-0 border-transparent border-r-purple-500"></div>
                <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Code className="w-3 h-3 text-white" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Easy Integration
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Works with any website platform
            </p>
          </div>

          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="w-3 h-3 text-white" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              24/7 Automation
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Handle quotes and scheduling
            </p>
          </div>

          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Lightning className="w-3 h-3 text-white" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Business Intelligence
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Connect all your systems
            </p>
          </div>
        </div>

        {/* Embedded Chat */}
        <EmbeddedChat isActive={isChatActive} onToggle={toggleChat} />
      </div>
    </section>
  );
}
