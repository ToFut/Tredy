import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Code,
  Sparkles,
  Zap,
  Shield,
  Globe,
  Users,
  TrendingUp,
  CheckCircle,
  Star,
  Award,
  Building,
  MessageCircle,
  Calendar,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Professional Construction Company Data
const COMPANY_DATA = {
  name: "Greenfield Construction",
  tagline: "Building Dreams Since 1985",
  description:
    "Family-owned construction company specializing in residential and commercial projects. Licensed, bonded, and insured with over 38 years of excellence.",
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
    "Roofing & Siding",
    "Flooring Installation",
  ],
  features: [
    "Licensed & Insured",
    "Free Estimates",
    "Quality Guarantee",
    "Local References",
    "24/7 Emergency Service",
    "Warranty Protection",
  ],
  testimonials: [
    {
      text: "Mike and his team did an amazing job on our kitchen remodel. Professional, on time, and within budget. Highly recommend!",
      author: "Sarah Johnson",
      rating: 5,
      project: "Kitchen Remodel",
    },
    {
      text: "We've used Greenfield for 3 projects now. Always reliable and great quality work. They're our go-to construction company.",
      author: "Robert Chen",
      rating: 5,
      project: "Multiple Projects",
    },
    {
      text: "Best construction company in the area. Professional, honest, and delivers exactly what they promise.",
      author: "Maria Rodriguez",
      rating: 5,
      project: "Custom Home",
    },
  ],
  contact: {
    phone: "(555) 123-4567",
    email: "info@greenfieldconstruction.com",
    address: "123 Main Street, Springfield, IL 62701",
    hours: "Mon-Fri: 7AM-6PM, Sat: 8AM-4PM",
  },
};

// AI Chat Messages for Demo
const DEMO_MESSAGES = [
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

// Professional Chat Component
function ProfessionalChat({ isActive, onToggle }) {
  const [messages, setMessages] = useState(DEMO_MESSAGES.slice(0, 2));
  const [isTyping, setIsTyping] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(2);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isActive && currentMessageIndex < DEMO_MESSAGES.length) {
      const timer = setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setMessages((prev) => [...prev, DEMO_MESSAGES[currentMessageIndex]]);
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
    setMessages(DEMO_MESSAGES.slice(0, 2));
    setCurrentMessageIndex(2);
    setIsTyping(false);
  };

  return (
    <div
      className={`fixed bottom-6 right-6 w-80 h-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 transform transition-all duration-500 ${
        isActive
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-full opacity-0 scale-95"
      }`}
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
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
        <div className="flex items-center gap-2">
          <button
            onClick={resetDemo}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Reset demo"
          >
            <RotateCcw className="w-3 h-3 text-gray-500" />
          </button>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-xl text-sm ${
                msg.type === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
              }`}
            >
              <p className="leading-relaxed">{msg.message}</p>
              {msg.isAnalysis && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-green-800 dark:text-green-200">
                      AI Analysis
                    </span>
                  </div>
                </div>
              )}
              {msg.isAction && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightning className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                      Automated Actions
                    </span>
                  </div>
                </div>
              )}
              <p className="text-xs opacity-70 mt-2">{msg.timestamp}</p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                <span className="text-xs text-gray-500 ml-2">
                  AI is analyzing...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Ask about your project..."
            className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled
          />
          <button className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Professional Demo Component
export default function ProfessionalDemo({ className = "" }) {
  const [isChatActive, setIsChatActive] = useState(false);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleChat = () => {
    setIsChatActive(!isChatActive);
  };

  const startDemo = () => {
    setIsDemoPlaying(true);
    setIsChatActive(true);
  };

  return (
    <section
      className={`py-16 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/10 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Professional Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-full mb-6">
            <Code className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Professional Website Integration
            </span>
          </div>

          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Transform Your Business with AI
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            See how professional businesses integrate AI-powered customer
            service into their existing websites with seamless, elegant
            solutions.
          </p>

          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Works with any website</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>5-minute setup</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Professional design</span>
            </div>
          </div>

          <button
            onClick={startDemo}
            className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            <Play className="w-5 h-5" />
            <span>View Professional Demo</span>
          </button>
        </div>

        {/* Professional Demo Container with Middle Blur Effect */}
        <div className="relative max-w-6xl mx-auto">
          {/* Sophisticated Background Blur Layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100/40 via-blue-100/30 to-purple-100/40 backdrop-blur-3xl rounded-3xl"></div>
          <div className="absolute inset-4 bg-gradient-to-br from-white/60 via-blue-50/40 to-purple-50/40 backdrop-blur-2xl rounded-2xl"></div>

          {/* Main Demo Container */}
          <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            {/* Professional Header */}
            <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-transparent backdrop-blur-sm"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                    <Building className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {COMPANY_DATA.name}
                    </h3>
                    <p className="text-orange-100 text-sm font-medium">
                      {COMPANY_DATA.tagline}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-2 text-orange-100">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">
                      Call: {COMPANY_DATA.contact.phone}
                    </span>
                  </div>
                  <button className="px-6 py-3 bg-white text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-all duration-300 hover:scale-105 shadow-lg">
                    Free Estimate
                  </button>
                </div>
              </div>
            </div>

            {/* Professional Navigation */}
            <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100/50 px-6 py-3">
              <div className="flex items-center gap-8">
                {["Home", "Services", "Projects", "About", "Contact"].map(
                  (item, index) => (
                    <a
                      key={item}
                      href="#"
                      className={`text-sm font-medium transition-all duration-300 hover:text-orange-600 relative group ${
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

            {/* Professional Website Content with Middle Blur */}
            <div className="relative">
              {/* Top Section - Clear */}
              <div className="p-8 bg-gradient-to-br from-gray-50/90 to-white/90 backdrop-blur-sm">
                {/* Hero Section */}
                <div className="mb-12">
                  <h4 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                    Quality Construction Services You Can Trust
                  </h4>
                  <p className="text-gray-600 mb-8 text-lg leading-relaxed max-w-3xl">
                    {COMPANY_DATA.description}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {COMPANY_DATA.features.slice(0, 6).map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100/50 hover:shadow-md hover:bg-white/95 transition-all duration-300"
                      >
                        <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Services Grid */}
                <div className="mb-12">
                  <h5 className="text-2xl font-bold text-gray-900 mb-6">
                    Our Services
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {COMPANY_DATA.services.map((service, index) => (
                      <div
                        key={index}
                        className="group p-5 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-100/50 hover:border-orange-200/50 hover:shadow-lg hover:bg-white/95 transition-all duration-300 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100/90 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-orange-200/90 transition-colors">
                            <Building className="w-5 h-5 text-orange-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600 transition-colors">
                            {service}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Middle Section - Blurred Effect */}
              <div className="relative">
                {/* Blur Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-transparent backdrop-blur-md z-10"></div>

                {/* Content Behind Blur */}
                <div className="p-8 bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm">
                  {/* Stats & Testimonials */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h5 className="text-2xl font-bold text-gray-900 mb-6">
                        Why Choose Us
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(COMPANY_DATA.stats).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="text-center p-5 bg-gradient-to-br from-orange-50/90 to-orange-100/90 backdrop-blur-sm rounded-xl border border-orange-200/50 hover:shadow-md hover:from-orange-50/95 hover:to-orange-100/95 transition-all duration-300"
                            >
                              <div className="text-3xl font-bold text-orange-600 mb-2">
                                {value}
                              </div>
                              <div className="text-sm text-gray-600 capitalize font-medium">
                                {key}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-2xl font-bold text-gray-900 mb-6">
                        What Our Clients Say
                      </h5>
                      <div className="space-y-4">
                        {COMPANY_DATA.testimonials.map((testimonial, index) => (
                          <div
                            key={index}
                            className="p-5 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-100/50 shadow-sm hover:shadow-md hover:bg-white/95 transition-all duration-300"
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <div className="flex text-yellow-400">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-4 h-4 fill-current"
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                {testimonial.project}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 italic leading-relaxed mb-2">
                              "{testimonial.text}"
                            </p>
                            <p className="text-xs text-gray-600 font-medium">
                              — {testimonial.author}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section - Clear */}
              <div className="p-8 bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm">
                {/* Premium Contact CTA */}
                <div className="bg-gradient-to-r from-orange-50/90 to-orange-100/90 backdrop-blur-sm rounded-2xl p-8 border border-orange-200/50 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-2xl font-bold text-gray-900 mb-3">
                        Ready to Start Your Project?
                      </h5>
                      <p className="text-gray-600 mb-4">
                        Get a free estimate today. Call{" "}
                        {COMPANY_DATA.contact.phone}
                      </p>
                      <div className="flex items-center gap-8 text-sm text-gray-600">
                        <span className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-orange-500" />
                          {COMPANY_DATA.contact.email}
                        </span>
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-orange-500" />
                          {COMPANY_DATA.contact.address}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <button className="px-8 py-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all duration-300 hover:scale-105 shadow-lg">
                        Call Now
                      </button>
                      <button
                        onClick={toggleChat}
                        className="flex items-center gap-3 px-8 py-4 bg-white text-orange-600 border border-orange-300 rounded-xl font-semibold hover:bg-orange-50 transition-all duration-300 hover:scale-105 shadow-sm"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>Chat Online</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Chat Button */}
            <div className="absolute bottom-8 right-8">
              <button
                onClick={toggleChat}
                className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
              >
                <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </button>
            </div>
          </div>

          {/* Professional Labels and Arrows */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Your Website Label */}
            <div className="absolute top-12 left-12 z-40">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-gray-200/50">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-800">
                    Your Professional Website
                  </span>
                </div>
              </div>
              <div className="absolute top-14 left-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
            </div>

            {/* AI Chat Label */}
            <div className="absolute bottom-24 right-24 z-40">
              <div className="bg-gradient-to-r from-blue-500/95 to-purple-500/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg text-white">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                  <span className="text-sm font-semibold">AI Assistant</span>
                </div>
              </div>
              <div className="absolute bottom-14 right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-500/95"></div>
            </div>

            {/* Arrow from Website to Chat */}
            <div className="absolute bottom-36 right-40 z-30">
              <div className="flex items-center gap-3">
                <div className="w-20 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <div className="w-0 h-0 border-l-4 border-r-0 border-t-2 border-b-2 border-transparent border-l-purple-500"></div>
              </div>
            </div>

            {/* AI Workspace Label */}
            <div className="absolute top-1/2 left-8 z-40">
              <div className="bg-gradient-to-r from-purple-500/95 to-pink-500/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg text-white">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                  <span className="text-sm font-semibold">AI Workspace</span>
                </div>
                <div className="text-xs text-purple-100 mt-1">
                  Business intelligence & automation
                </div>
              </div>
              <div className="absolute top-14 left-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-500/95"></div>
            </div>

            {/* Arrow from Website to Workspace */}
            <div className="absolute top-1/2 left-20 z-30">
              <div className="flex items-center gap-3">
                <div className="w-0 h-0 border-r-4 border-t-2 border-b-2 border-l-0 border-transparent border-r-purple-500"></div>
                <div className="w-16 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Code className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Easy Integration
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Works with any website platform and design system
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              24/7 Automation
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Handle customer inquiries and scheduling automatically
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Business Intelligence
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect all your systems for comprehensive insights
            </p>
          </div>
        </div>

        {/* Embedded Chat */}
        <ProfessionalChat isActive={isChatActive} onToggle={toggleChat} />
      </div>
    </section>
  );
}
