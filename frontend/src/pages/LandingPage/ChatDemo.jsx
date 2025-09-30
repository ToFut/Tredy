import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Bot,
  Activity,
  Brain,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  Loader2,
  Zap,
  Cpu,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Tool logos mapping
const toolLogos = {
  "Google Calendar":
    "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg",
  Gmail:
    "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg",
  WhatsApp: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
  "Google Drive":
    "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg",
  CRM: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Laravel.svg",
  "AI Analysis":
    "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
  "AI Engine":
    "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
  Analytics:
    "https://upload.wikimedia.org/wikipedia/commons/3/3f/Google_Chrome_icon_%282011%29.svg",
  Figma: "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg",
  Jira: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Jira_Logo.svg",
  Slack:
    "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
  GitHub:
    "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg",
  Notion:
    "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
};

export default function ChatDemo() {
  const { t } = useTranslation();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [expandedDetails, setExpandedDetails] = useState({});
  const [typingMessage, setTypingMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const chatContainerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const isScrollingRef = useRef(false);

  // Smooth scroll function with debouncing
  const smoothScrollToBottom = useCallback((delay = 0) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    if (isScrollingRef.current) return;

    scrollTimeoutRef.current = setTimeout(() => {
      if (chatContainerRef.current && !isScrollingRef.current) {
        isScrollingRef.current = true;
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth",
        });

        // Reset scrolling flag after animation completes
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 500);
      }
    }, delay);
  }, []);

  // Enhanced chat messages with rich formatting - Real Estate Business Automation
  const chatMessages = [
    {
      type: "assistant",
      status: "complete",
      message:
        "Hi! I'm Tredy. What's your website? I'll analyze it and suggest automation opportunities.",
      timestamp: "9:31 AM",
    },
    {
      type: "user",
      message: "https://realestate.com",
      timestamp: "9:32 AM",
    },
    {
      type: "assistant",
      status: "processing",
      message:
        "Analyzing realestate.com... 🏠 I can see your property listings, contact forms, and lead generation tools. Connecting your connectors now...",
      tools: ["Web Scraper", "Gmail", "WhatsApp", "Google Drive", "CRM"],
      metrics: {
        time: "2.1s",
        confidence: 98,
        model: "GPT-4",
        tokens: 234,
      },
      thinking: [
        "🌐 Scanning realestate.com website structure",
        "📋 Analyzing property listings and contact forms",
        "🔍 Identifying lead capture mechanisms",
        "📧 Detecting email integration opportunities",
        "📱 Finding WhatsApp contact options",
        "📁 Checking document management needs",
        "📊 Preparing CRM synchronization setup",
      ],
      timestamp: "9:32 AM",
    },
    {
      type: "assistant",
      status: "complete",
      message: {
        type: "structured",
        content: {
          title: "🏠 Website Analysis Complete - realestate.com",
          subtitle:
            "Found 3 automation opportunities that could save you 15+ hours per week!",
          quickSummary: [
            { icon: "📧", label: "Lead Processing", status: "Ready" },
            { icon: "📱", label: "Email Automation", status: "Ready" },
            { icon: "📁", label: "CRM Sync", status: "Ready" },
            { icon: "📊", label: "View Analysis", status: "Ready" },
          ],
          footer: "💡 Ready to create intelligent workflows",
        },
      },
      timestamp: "9:32 AM",
    },
    {
      type: "user",
      message: "Connected! Now what can you do for me?",
      timestamp: "9:33 AM",
    },
    {
      type: "assistant",
      status: "processing",
      message:
        "Excellent! I've analyzed your connected systems and found some powerful automation opportunities. Should I create an intelligent workflow that monitors your marketing folder for new leads and automatically responds to prospects via WhatsApp?",
      tools: ["Google Drive", "WhatsApp", "CRM", "AI Analysis"],
      metrics: {
        time: "2.8s",
        confidence: 96,
        model: "GPT-4",
        tokens: 342,
      },
      thinking: [
        "🔍 Scanning Google Drive marketing folder structure",
        "📊 Analyzing 23 lead documents and contact lists",
        "🤖 Evaluating WhatsApp integration capabilities",
        "⚡ Preparing intelligent lead response system",
        "🔄 Setting up real-time CRM synchronization",
        "📈 Calculating potential conversion improvements",
      ],
      timestamp: "9:33 AM",
    },
    {
      type: "assistant",
      status: "complete",
      message: {
        type: "structured",
        content: {
          title: "🚀 Intelligent Lead Response System",
          subtitle:
            "I've analyzed your marketing folder and found incredible automation potential!",
          quickStats: [
            { label: "📁 Documents", value: "23 lead files" },
            { label: "👥 Prospects", value: "156 contacts" },
            { label: "⚡ Response Rate", value: "23% → 67%" },
            { label: "💰 Conversion", value: "8% → 24%" },
          ],
          automation: [
            { icon: "👁️", label: "Real-time monitoring" },
            { icon: "🧠", label: "AI contact parsing" },
            { icon: "💬", label: "WhatsApp automation" },
            { icon: "🔄", label: "CRM synchronization" },
          ],
          footer:
            "🎯 This automation could increase your lead conversion by 200% and save 15 hours per week!",
        },
      },
      timestamp: "9:33 AM",
    },
    {
      type: "user",
      message: "This sounds amazing! Yes, create that workflow immediately!",
      timestamp: "9:34 AM",
    },
    {
      type: "assistant",
      status: "processing",
      message: "🚀 Creating your intelligent lead automation system...",
      tools: ["Google Drive", "WhatsApp", "CRM", "AI Engine", "Analytics"],
      metrics: {
        time: "4.2s",
        confidence: 98,
        model: "GPT-4",
        tokens: 512,
      },
      thinking: [
        "🔧 Building automated lead response workflow",
        "📁 Setting up Google Drive real-time monitoring",
        "💬 Configuring intelligent WhatsApp message templates",
        "🔄 Integrating seamless CRM synchronization",
        "🧪 Testing all workflow components",
        "⚡ Activating 24/7 intelligent monitoring",
        "📊 Setting up performance analytics dashboard",
      ],
      timestamp: "9:34 AM",
    },
    {
      type: "assistant",
      status: "complete",
      message: {
        type: "structured",
        content: {
          title: "🎉 Workflow Successfully Created & Running!",
          subtitle:
            "Your intelligent lead automation system is now live and processing leads in real-time!",
          status: [
            { icon: "📁", label: "Folder Monitoring", status: "🟢 Active" },
            { icon: "💬", label: "WhatsApp Integration", status: "🟢 Active" },
            { icon: "🔄", label: "CRM Synchronization", status: "🟢 Active" },
            { icon: "🧠", label: "AI Processing", status: "🟢 Active" },
          ],
          performance: [
            { label: "📊 Leads Processed", value: "23 (+3 this hour)" },
            { label: "💬 Messages Sent", value: "15 WhatsApp (67% response)" },
            { label: "🔄 CRM Updates", value: "8 records (100% accuracy)" },
            { label: "⏱️ Response Time", value: "2.3 min (vs 4.2 hours)" },
          ],
          footer:
            "🚀 All systems operational! Saving 15+ hours/week and increasing conversions by 200%!",
        },
      },
      timestamp: "9:34 AM",
    },
    {
      type: "assistant",
      status: "complete",
      message: {
        type: "structured",
        content: {
          title: "📊 Intelligent Daily Monitoring Active",
          subtitle:
            "I'll continuously monitor your lead generation and send you comprehensive insights every morning:",
          monitoring: [
            {
              icon: "🎯",
              label: "New Leads",
              value: "Auto-processed & qualified",
            },
            {
              icon: "💬",
              label: "WhatsApp Engagement",
              value: "Optimized messaging",
            },
            {
              icon: "🔄",
              label: "CRM Health",
              value: "Perfect data integrity",
            },
            {
              icon: "📊",
              label: "Conversion Analytics",
              value: "ROI insights & tips",
            },
          ],
          settings: [
            {
              icon: "⏰",
              label: "Report Schedule",
              value: "8:00 AM daily + alerts",
            },
            {
              icon: "📧",
              label: "Email Delivery",
              value: "your-email@company.com",
            },
            { icon: "🔍", label: "Monitoring", value: "24/7 surveillance" },
            { icon: "🚨", label: "Smart Alerts", value: "High-value leads" },
          ],
          footer:
            "🎯 Your automation is now saving 15+ hours/week and increasing revenue by 200%! Daily insights delivered to your-email@company.com",
        },
      },
      timestamp: "9:35 AM",
    },
  ];

  // Auto-scroll to bottom when new message appears
  useEffect(() => {
    smoothScrollToBottom(150);
  }, [currentMessageIndex, smoothScrollToBottom]);

  // Typing animation effect with smooth scrolling
  useEffect(() => {
    if (currentMessageIndex < chatMessages.length) {
      const currentMsg = chatMessages[currentMessageIndex];

      if (
        currentMsg.type === "assistant" &&
        typeof currentMsg.message === "string"
      ) {
        setIsTyping(true);
        let charIndex = 0;
        const message = currentMsg.message;

        const typingInterval = setInterval(() => {
          if (charIndex <= message.length) {
            setTypingMessage(message.substring(0, charIndex));
            charIndex++;

            // Smooth scroll during typing (less frequent)
            if (charIndex % 15 === 0) {
              smoothScrollToBottom(50);
            }
          } else {
            clearInterval(typingInterval);
            setIsTyping(false);

            // Final scroll after typing completes
            smoothScrollToBottom(300);

            setTimeout(() => {
              if (currentMessageIndex < chatMessages.length - 1) {
                setCurrentMessageIndex(currentMessageIndex + 1);
                setTypingMessage("");
              }
            }, 2500);
          }
        }, 35); // Slightly faster typing for smoother feel

        return () => clearInterval(typingInterval);
      } else {
        // For non-typing messages, show immediately and scroll
        smoothScrollToBottom(200);

        setTimeout(
          () => {
            if (currentMessageIndex < chatMessages.length - 1) {
              setCurrentMessageIndex(currentMessageIndex + 1);
            }
          },
          currentMsg.type === "assistant" ? 2800 : 1200
        );
      }
    } else {
      // Reset animation with smooth scroll to top
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }

        setTimeout(() => {
          setCurrentMessageIndex(0);
          setTypingMessage("");
          setExpandedDetails({});
        }, 1200);
      }, 5500);
    }
  }, [currentMessageIndex, smoothScrollToBottom]);

  const renderStructuredMessage = (content) => {
    return (
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold text-gray-900">{content.title}</h4>
          {content.subtitle && (
            <p className="text-xs text-gray-600 mt-1">{content.subtitle}</p>
          )}
        </div>

        {/* Quick Summary */}
        {content.quickSummary && (
          <div className="grid grid-cols-2 gap-2">
            {content.quickSummary.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white rounded-lg p-2 border border-purple-100"
              >
                <span className="text-sm">{item.icon}</span>
                <span className="text-xs font-medium text-gray-700">
                  {item.label}
                </span>
                <span className="text-xs text-green-600 font-medium">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {content.quickStats && (
          <div className="grid grid-cols-2 gap-2">
            {content.quickStats.map((stat, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white rounded-lg p-2 border border-purple-100"
              >
                <span className="text-xs text-gray-600">{stat.label}</span>
                <span className="text-xs font-medium text-purple-700">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Automation Features */}
        {content.automation && (
          <div className="grid grid-cols-2 gap-2">
            {content.automation.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white rounded-lg p-2 border border-purple-100"
              >
                <span className="text-sm">{feature.icon}</span>
                <span className="text-xs font-medium text-gray-700">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Status */}
        {content.status && (
          <div className="grid grid-cols-2 gap-2">
            {content.status.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white rounded-lg p-2 border border-purple-100"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs font-medium text-gray-700">
                    {item.label}
                  </span>
                </div>
                <span className="text-xs font-medium text-green-600">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Performance */}
        {content.performance && (
          <div className="space-y-1">
            {content.performance.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white rounded-lg p-2 border border-purple-100"
              >
                <span className="text-xs text-gray-600">{item.label}</span>
                <span className="text-xs font-medium text-purple-700">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Monitoring */}
        {content.monitoring && (
          <div className="grid grid-cols-2 gap-2">
            {content.monitoring.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white rounded-lg p-2 border border-purple-100"
              >
                <span className="text-sm">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-700">
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Settings */}
        {content.settings && (
          <div className="grid grid-cols-2 gap-2">
            {content.settings.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white rounded-lg p-2 border border-purple-100"
              >
                <span className="text-sm">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-700">
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {content.footer && (
          <div className="bg-green-50 rounded-lg p-2 border border-green-200">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              <p className="text-xs text-green-800 font-medium">
                {content.footer}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 flex flex-col fixed-chat-container">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-5 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/90 to-purple-600/90"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bot className="w-7 h-7 text-white" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse shadow-lg"></div>
            </div>
            <div>
              <span className="text-white font-bold text-lg">
                Tredy AI Workspace
              </span>
              <div className="flex items-center gap-2 text-xs text-purple-100">
                <Activity className="w-3 h-3 animate-pulse" />
                <span>Live Interactive Demo</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/30">
              <Sparkles className="w-4 h-4 text-white animate-spin" />
              <span className="text-xs text-white font-semibold">
                AI Active
              </span>
            </div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4 bg-gradient-to-b from-purple-50/30 via-white to-purple-50/20 scroll-smooth min-h-0"
        style={{
          scrollBehavior: "smooth",
          scrollPaddingBottom: "20px",
        }}
      >
        {chatMessages.slice(0, currentMessageIndex + 1).map((msg, idx) => (
          <div
            key={idx}
            className={`${msg.type === "user" ? "flex justify-end" : "flex justify-start"} animate-messageSlide`}
            style={{ animationDelay: `${idx * 0.2}s` }}
          >
            <div
              className={`max-w-[85%] sm:max-w-[90%] ${msg.type === "user" ? "order-2" : ""}`}
            >
              {msg.type === "user" ? (
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-5 rounded-2xl rounded-tr-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInRight">
                  <p className="text-sm leading-relaxed font-medium">
                    {msg.message}
                  </p>
                  <p className="text-xs opacity-80 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {msg.timestamp}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Main Message */}
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl rounded-tl-sm shadow-xl border border-purple-100 p-6 hover:shadow-2xl transition-all duration-300 animate-slideInLeft">
                    {typeof msg.message === "string" ? (
                      <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed font-medium">
                        {idx === currentMessageIndex && isTyping ? (
                          <>
                            {typingMessage}
                            <span className="inline-block w-2 h-4 bg-purple-600 animate-pulse ml-1 rounded-sm"></span>
                          </>
                        ) : (
                          msg.message
                        )}
                      </p>
                    ) : (
                      msg.message.type === "structured" &&
                      renderStructuredMessage(msg.message.content)
                    )}

                    <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {msg.timestamp}
                    </p>
                  </div>

                  {/* Compact Tool Logos with Metrics - Single Line */}
                  {msg.tools && idx <= currentMessageIndex && (
                    <div className="flex items-center gap-3 text-xs text-gray-600 px-3 mt-3 bg-purple-50/50 rounded-lg py-2 border border-purple-100 overflow-x-auto">
                      {/* Compact Tool Logos */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {msg.tools.map((tool, ti) => (
                          <div
                            key={ti}
                            className="relative group flex-shrink-0"
                          >
                            <div className="w-5 h-5 bg-white rounded-full border border-purple-200 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110">
                              {toolLogos[tool] ? (
                                <img
                                  src={toolLogos[tool]}
                                  alt={tool}
                                  className="w-3 h-3 rounded-full object-cover"
                                  title={tool}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-3 h-3 rounded-full flex items-center justify-center text-xs font-bold ${toolLogos[tool] ? "hidden" : "flex"}`}
                                style={{
                                  backgroundColor:
                                    tool === "AI Analysis" ||
                                    tool === "AI Engine"
                                      ? "#10b981"
                                      : tool === "Analytics"
                                        ? "#3b82f6"
                                        : tool === "CRM"
                                          ? "#f59e0b"
                                          : "#8b5cf6",
                                  color: "white",
                                }}
                              >
                                {tool.charAt(0)}
                              </div>
                            </div>
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-purple-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-10">
                              {tool}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Separator */}
                      <span className="text-purple-300 flex-shrink-0">•</span>

                      {/* Time */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Zap className="w-3 h-3 text-purple-600" />
                        <span className="font-medium">{msg.metrics.time}</span>
                      </div>

                      {/* Separator */}
                      <span className="text-purple-300 flex-shrink-0">•</span>

                      {/* Confidence */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="w-12 bg-purple-100 rounded-full h-1.5 relative overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-1.5 rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${msg.metrics.confidence}%` }}
                          >
                            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                          </div>
                        </div>
                        <span className="font-bold text-purple-700 text-xs">
                          {msg.metrics.confidence}%
                        </span>
                      </div>

                      {/* Separator */}
                      <span className="text-purple-300 flex-shrink-0">•</span>

                      {/* Model */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Cpu className="w-3 h-3 text-purple-600" />
                        <span className="font-medium">{msg.metrics.model}</span>
                      </div>

                      {/* Expandable Details */}
                      {msg.thinking && (
                        <>
                          <span className="text-gray-300 flex-shrink-0">•</span>
                          <button
                            onClick={() =>
                              setExpandedDetails({
                                ...expandedDetails,
                                [idx]: !expandedDetails[idx],
                              })
                            }
                            className="flex items-center gap-1 text-purple-600 hover:text-purple-800 transition-colors duration-200 font-medium flex-shrink-0"
                          >
                            <Brain className="w-3 h-3" />
                            <span>Details</span>
                            {expandedDetails[idx] ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Expanded Thinking Process */}
                  {msg.thinking && expandedDetails[idx] && (
                    <div className="ml-4 p-5 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200 shadow-sm animate-fadeIn">
                      <div className="flex items-center gap-2 text-sm font-bold text-purple-700 mb-4">
                        <Brain className="w-4 h-4 animate-pulse" />
                        AI Thinking Process
                      </div>
                      <div className="space-y-3">
                        {msg.thinking.map((thought, ti) => (
                          <div
                            key={ti}
                            className="flex items-start gap-3 animate-slideInLeft"
                            style={{ animationDelay: `${ti * 0.1}s` }}
                          >
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-1 animate-pulse"></div>
                            <span className="text-sm text-gray-700 leading-relaxed">
                              {thought}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-purple-200 text-xs text-purple-600 font-medium">
                        ⚡ {msg.metrics.tokens} tokens processed
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="flex-shrink-0 p-6 bg-gradient-to-r from-purple-50 to-purple-100/50 border-t border-purple-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type @tredy to start your AI workflow..."
              className="w-full px-3 sm:px-4 lg:px-5 py-3 sm:py-4 border-2 border-purple-200 rounded-xl sm:rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white/80 backdrop-blur-sm transition-all duration-300 text-xs sm:text-sm font-medium placeholder-gray-500"
              disabled
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="flex items-center gap-1 text-xs text-purple-600 font-medium">
                <Sparkles className="w-3 h-3 animate-pulse" />
                <span>AI Ready</span>
              </div>
            </div>
          </div>
          <button className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl hover:from-purple-600 hover:to-purple-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-4 text-center">
          <p className="text-xs text-purple-600 font-medium">
            ✨ This is a live interactive demo showcasing Tredy's AI
            capabilities
          </p>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes messageSlide {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-messageSlide {
          animation: messageSlide 0.6s ease-out forwards;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgb(248 250 252);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgb(147 51 234);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgb(126 34 206);
        }
        
        /* Google-style logo animations */
        @keyframes logoFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        
        @keyframes logoGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.1);
          }
        }
        
        .logo-container:hover {
          animation: logoFloat 0.6s ease-in-out infinite, logoGlow 2s ease-in-out infinite;
        }
        
        /* Smooth transitions for all interactive elements */
        .tool-logo-item {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .tool-logo-item:hover {
          transform: translateY(-1px) scale(1.05);
        }
      `}</style>
    </div>
  );
}
