import React, { useState, useEffect, useRef } from "react";
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
  Sparkles
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Tool logos mapping
const toolLogos = {
  "Google Calendar": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg",
  "Gmail": "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg",
  "Figma": "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg",
  "Jira": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Jira_Logo.svg",
  "Slack": "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
  "GitHub": "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg",
  "Notion": "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
  "Drive": "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"
};

export default function ChatDemo() {
  const { t } = useTranslation();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [expandedDetails, setExpandedDetails] = useState({});
  const [typingMessage, setTypingMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const chatContainerRef = useRef(null);

  // Enhanced chat messages with rich formatting
  const chatMessages = [
    {
      type: "user",
      message: "@tredy check my calendar for tomorrow",
      timestamp: "9:32 AM"
    },
    {
      type: "assistant",
      status: "processing",
      message: "I'll check your calendar for tomorrow's schedule.",
      tools: ["Google Calendar"],
      metrics: {
        time: "0.8s",
        confidence: 98,
        model: "GPT-4",
        tokens: 127
      },
      thinking: [
        "Accessing Google Calendar API",
        "Retrieving events for tomorrow (Nov 15, 2024)",
        "Formatting schedule information"
      ],
      timestamp: "9:32 AM"
    },
    {
      type: "assistant",
      status: "complete",
      message: {
        type: "structured",
        content: {
          title: "Tomorrow's Schedule",
          subtitle: "Thursday, November 15, 2024",
          items: [
            { time: "10:00 AM", title: "Product Review", subtitle: "with Design Team", tag: "Meeting", color: "purple" },
            { time: "2:00 PM", title: "Client Demo", subtitle: "via Zoom", tag: "Presentation", color: "purple" },
            { time: "4:30 PM", title: "Weekly Standup", subtitle: "Team sync", tag: "Recurring", color: "purple" }
          ]
        }
      },
      timestamp: "9:32 AM"
    },
    {
      type: "user",
      message: "@tredy send a reminder email to the design team about tomorrow's meeting and attach the latest mockups from Figma",
      timestamp: "9:33 AM"
    },
    {
      type: "assistant",
      status: "processing",
      message: "I'll send a reminder email to the design team with the latest Figma mockups attached.",
      tools: ["Gmail", "Figma", "Google Calendar"],
      metrics: {
        time: "2.1s",
        confidence: 95,
        model: "GPT-4",
        tokens: 342
      },
      thinking: [
        "Fetching meeting details from calendar",
        "Accessing Figma API for latest mockups",
        "Found 2 files: Dashboard_v3.fig, Mobile_Screens_v2.fig",
        "Composing email with meeting context",
        "Attaching files and preparing to send"
      ],
      timestamp: "9:33 AM"
    },
    {
      type: "assistant",
      status: "complete",
      message: {
        type: "structured",
        content: {
          title: "✅ Email Sent Successfully",
          sections: [
            {
              label: "Recipients",
              value: "design-team@company.com",
              badge: "5 members"
            },
            {
              label: "Subject",
              value: "Reminder: Product Review Meeting Tomorrow at 10 AM"
            },
            {
              label: "Attachments",
              files: [
                { name: "Dashboard_v3.fig", size: "2.4 MB" },
                { name: "Mobile_Screens_v2.fig", size: "1.8 MB" }
              ]
            }
          ],
          footer: "The team should receive it shortly."
        }
      },
      timestamp: "9:33 AM"
    },
    {
      type: "user",
      message: "@tredy create a Jira ticket for the feedback from yesterday's client call and schedule a follow-up meeting for next week",
      timestamp: "9:34 AM"
    },
    {
      type: "assistant",
      status: "processing",
      message: "I'll create a Jira ticket for the client feedback and schedule a follow-up meeting.",
      tools: ["Jira", "Slack", "Google Calendar", "Gmail"],
      metrics: {
        time: "3.2s",
        confidence: 92,
        model: "GPT-4",
        tokens: 523
      },
      thinking: [
        "Analyzing Slack #client-feedback channel",
        "Extracting key points from yesterday's discussion",
        "Creating Jira ticket with extracted information",
        "Setting priority based on feedback urgency",
        "Finding available calendar slots next week",
        "Sending meeting invites to stakeholders"
      ],
      timestamp: "9:34 AM"
    },
    {
      type: "assistant",
      status: "complete",
      message: {
        type: "structured",
        content: {
          title: "✅ Tasks Completed",
          cards: [
            {
              icon: "📝",
              title: "Jira Ticket Created",
              id: "PROD-1247",
              items: [
                { label: "Title", value: "Client Feedback: Dashboard Performance" },
                { label: "Priority", value: "High", color: "purple" },
                { label: "Assigned", value: "Backend Team" },
                { label: "Sprint", value: "Sprint 24" }
              ]
            },
            {
              icon: "📅",
              title: "Meeting Scheduled",
              items: [
                { label: "Date", value: "Thursday, Nov 21" },
                { label: "Time", value: "3:00 PM EST" },
                { label: "Duration", value: "45 minutes" },
                { label: "Invitees", value: "8 participants" }
              ]
            }
          ],
          footer: "Posted summary in #client-feedback Slack channel"
        }
      },
      timestamp: "9:34 AM"
    }
  ];

  // Auto-scroll to bottom when new message appears
  useEffect(() => {
    if (chatContainerRef.current) {
      const scrollToBottom = () => {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      };
      
      // Delay scroll to allow message to render
      setTimeout(scrollToBottom, 100);
    }
  }, [currentMessageIndex]);

  // Typing animation effect with smooth scrolling
  useEffect(() => {
    if (currentMessageIndex < chatMessages.length) {
      const currentMsg = chatMessages[currentMessageIndex];
      
      if (currentMsg.type === "assistant" && typeof currentMsg.message === "string") {
        setIsTyping(true);
        let charIndex = 0;
        const message = currentMsg.message;
        
        const typingInterval = setInterval(() => {
          if (charIndex <= message.length) {
            setTypingMessage(message.substring(0, charIndex));
            charIndex++;
            
            // Auto-scroll during typing
            if (chatContainerRef.current && charIndex % 10 === 0) {
              chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
              });
            }
          } else {
            clearInterval(typingInterval);
            setIsTyping(false);
            
            // Final scroll after typing completes
            setTimeout(() => {
              if (chatContainerRef.current) {
                chatContainerRef.current.scrollTo({
                  top: chatContainerRef.current.scrollHeight,
                  behavior: 'smooth'
                });
              }
              
              setTimeout(() => {
                if (currentMessageIndex < chatMessages.length - 1) {
                  setCurrentMessageIndex(currentMessageIndex + 1);
                  setTypingMessage("");
                }
              }, 2000);
            }, 500);
          }
        }, 40);
        
        return () => clearInterval(typingInterval);
      } else {
        // For non-typing messages, show immediately and scroll
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
          
          setTimeout(() => {
            if (currentMessageIndex < chatMessages.length - 1) {
              setCurrentMessageIndex(currentMessageIndex + 1);
            }
          }, currentMsg.type === "assistant" ? 3000 : 1500);
        }, 500);
      }
    } else {
      // Reset animation with smooth scroll to top
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
        
        setTimeout(() => {
          setCurrentMessageIndex(0);
          setTypingMessage("");
          setExpandedDetails({});
        }, 1000);
      }, 6000);
    }
  }, [currentMessageIndex]);

  const renderStructuredMessage = (content) => {
    if (content.title === "Tomorrow's Schedule") {
      return (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">{content.title}</h4>
          <p className="text-sm text-gray-600">{content.subtitle}</p>
          <div className="space-y-2">
            {content.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-purple-50/50 rounded-lg p-3 border border-purple-100">
                <div className="text-xs font-medium text-gray-500 w-16">{item.time}</div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-600">{item.subtitle}</div>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  {item.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (content.sections) {
      return (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">{content.title}</h4>
          <div className="space-y-2">
            {content.sections.map((section, i) => (
              <div key={i}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">{section.label}</span>
                  {section.badge && (
                    <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                      {section.badge}
                    </span>
                  )}
                </div>
                <div className="text-gray-900 text-sm mt-1">
                  {section.value}
                  {section.files && (
                    <div className="flex gap-2 mt-2">
                      {section.files.map((file, fi) => (
                        <div key={fi} className="flex items-center gap-2 bg-purple-50 rounded-lg px-3 py-1 border border-purple-200">
                          <span className="text-xs font-medium">{file.name}</span>
                          <span className="text-xs text-gray-500">{file.size}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {content.footer && (
            <p className="text-sm text-gray-600 pt-2 border-t border-gray-200">
              {content.footer}
            </p>
          )}
        </div>
      );
    }

    if (content.cards) {
      return (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">{content.title}</h4>
          <div className="grid gap-3">
            {content.cards.map((card, i) => (
              <div key={i} className="bg-purple-50/30 rounded-lg p-4 border border-purple-100">
                <div className="flex items-start gap-2">
                  <span className="text-xl">{card.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-semibold text-sm text-gray-900">{card.title}</h5>
                      {card.id && (
                        <span className="px-2 py-1 text-xs font-mono bg-purple-700 text-white rounded-md">
                          {card.id}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {card.items.map((item, ii) => (
                        <div key={ii} className="flex items-center gap-2 text-xs">
                          <span className="text-gray-600">{item.label}:</span>
                          <span className="font-medium text-purple-600">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {content.footer && (
            <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-1 border border-purple-200">
              <CheckCircle2 className="w-3 h-3 text-purple-600" />
              {content.footer}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border-2 border-purple-200 hover:border-purple-300 transition-all duration-300">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/90 to-purple-600/90"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bot className="w-7 h-7 text-white" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse shadow-lg"></div>
            </div>
            <div>
              <span className="text-white font-bold text-lg">Tredy AI Workspace</span>
              <div className="flex items-center gap-2 text-xs text-purple-100">
                <Activity className="w-3 h-3 animate-pulse" />
                <span>Live Interactive Demo</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/30">
              <Sparkles className="w-4 h-4 text-white animate-spin" />
              <span className="text-xs text-white font-semibold">AI Active</span>
            </div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="h-[600px] overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-purple-50/30 via-white to-purple-50/20 scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
      >
        {chatMessages.slice(0, currentMessageIndex + 1).map((msg, idx) => (
          <div 
            key={idx} 
            className={`${msg.type === 'user' ? 'flex justify-end' : 'flex justify-start'} animate-messageSlide`}
            style={{ animationDelay: `${idx * 0.2}s` }}
          >
            <div className={`max-w-[90%] ${msg.type === 'user' ? 'order-2' : ''}`}>
              {msg.type === 'user' ? (
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-5 rounded-2xl rounded-tr-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInRight">
                  <p className="text-sm leading-relaxed font-medium">{msg.message}</p>
                  <p className="text-xs opacity-80 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {msg.timestamp}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Main Message */}
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl rounded-tl-sm shadow-xl border border-purple-100 p-6 hover:shadow-2xl transition-all duration-300 animate-slideInLeft">
                    {typeof msg.message === 'string' ? (
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
                      msg.message.type === 'structured' && renderStructuredMessage(msg.message.content)
                    )}
                    
                    <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {msg.timestamp}
                    </p>
                  </div>

                  {/* Compact Metrics Line */}
                  {msg.tools && idx <= currentMessageIndex && (
                    <div className="flex items-center gap-4 text-xs text-gray-600 px-3 mt-3 bg-purple-50/50 rounded-lg py-2 border border-purple-100">
                      {/* Tool Logos */}
                      <div className="flex items-center gap-2">
                        {msg.tools.map((tool, ti) => (
                          <div key={ti} className="relative group">
                            <div className="w-6 h-6 bg-white rounded-lg border border-purple-200 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110">
                              <img 
                                src={toolLogos[tool] || ""} 
                                alt={tool}
                                className="w-4 h-4 rounded"
                                title={tool}
                              />
                            </div>
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-purple-900 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                              {tool}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Separator */}
                      <span className="text-purple-300">•</span>

                      {/* Time */}
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-purple-600" />
                        <span className="font-medium">{msg.metrics.time}</span>
                      </div>

                      {/* Separator */}
                      <span className="text-purple-300">•</span>

                      {/* Confidence */}
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-purple-100 rounded-full h-2 relative overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${msg.metrics.confidence}%` }}
                          >
                            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                          </div>
                        </div>
                        <span className="font-bold text-purple-700">{msg.metrics.confidence}%</span>
                      </div>

                      {/* Separator */}
                      <span className="text-purple-300">•</span>

                      {/* Model */}
                      <div className="flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-purple-600" />
                        <span className="font-medium">{msg.metrics.model}</span>
                      </div>

                      {/* Expandable Details */}
                      {msg.thinking && (
                        <>
                          <span className="text-gray-300">•</span>
                          <button
                            onClick={() => setExpandedDetails({ ...expandedDetails, [idx]: !expandedDetails[idx] })}
                            className="flex items-center gap-1 text-purple-600 hover:text-purple-800 transition-colors duration-200 font-medium"
                          >
                            <Brain className="w-3 h-3" />
                            <span>Details</span>
                            {expandedDetails[idx] ? 
                              <ChevronDown className="w-3 h-3" /> : 
                              <ChevronRight className="w-3 h-3" />
                            }
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
                          <div key={ti} className="flex items-start gap-3 animate-slideInLeft" style={{ animationDelay: `${ti * 0.1}s` }}>
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-1 animate-pulse"></div>
                            <span className="text-sm text-gray-700 leading-relaxed">{thought}</span>
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
      <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100/50 border-t border-purple-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Type @tredy to start your AI workflow..." 
              className="w-full px-5 py-4 border-2 border-purple-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white/80 backdrop-blur-sm transition-all duration-300 text-sm font-medium placeholder-gray-500"
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
            ✨ This is a live interactive demo showcasing Tredy's AI capabilities
          </p>
        </div>
      </div>
      
      {/* Custom Styles */}
      <style jsx>{`
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
      `}</style>
    </div>
  );
}