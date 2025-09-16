import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Globe,
  Shield,
  Brain,
  Play,
  Star,
  Users,
  Zap,
  CheckCircle,
  Menu,
  X,
  Award,
  TrendUp as TrendingUp,
  Lock,
  Cloud,
  BarChart
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguageOptions } from "@/hooks/useLanguageOptions";
import ChatDemo from "./ChatDemo";
import EmbeddedCapabilityDemo from "./EmbeddedCapabilityDemo";
import BusinessChat from "@/components/BusinessChat";
import Workspace from "@/models/workspace";
import paths from "@/utils/paths";
import showToast from "@/utils/toast";
import AIEnterprisePlatform from "@/components/AIEnterprisePlatform";

export default function LandingPage() {
  const { t } = useTranslation();
  const { currentLanguage, supportedLanguages, getLanguageName, changeLanguage } = useLanguageOptions();
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [animatedCount, setAnimatedCount] = useState({ users: 0, integrations: 0, uptime: 0 });
  const [selectedIndustry, setSelectedIndustry] = useState("Real Estate");
  const [expandedFeature, setExpandedFeature] = useState(null);
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [emailError, setEmailError] = useState("");
  const [companyError, setCompanyError] = useState("");
  const [showSmartForm, setShowSmartForm] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");
  const [waitlistCount, setWaitlistCount] = useState(0);

  const faqs = [
    {
      question: "What is Tredy?",
      answer: "Tredy is an AI-powered workspace that connects, visualizes, and executes through threads. It integrates with 500+ apps and services, allowing you to manage your entire workflow through natural conversation."
    },
    {
      question: "How does the thread system work?",
      answer: "Tredy uses intelligent threading to maintain context across complex tasks. Each thread represents a workflow that can span multiple tools and actions, keeping everything organized and traceable."
    },
    {
      question: "Which integrations are available?",
      answer: "Tredy connects with 500+ apps including Gmail, Slack, Jira, GitHub, Figma, Google Calendar, Notion, and many more. You can use your own API keys or team-shared credentials."
    },
    {
      question: "Is my data secure?",
      answer: "Yes. Tredy offers enterprise-grade security with end-to-end encryption, SOC 2 compliance, and the option to self-host. Your data never leaves your control."
    },
    {
      question: "Can I customize Tredy for my team?",
      answer: "Absolutely. Tredy supports custom workflows, team-specific integrations, role-based access control, and white-label options for enterprise customers."
    }
  ];

  const industryTestimonials = [
    {
      name: "Sarah Chen",
      role: "CTO",
      company: "Atlassian",
      industry: "Software Development",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b5c5?w=64&h=64&fit=crop&crop=face",
      quote: "Tredy automated our entire CI/CD pipeline. We reduced deployment time from 4 hours to 15 minutes while maintaining 99.9% reliability.",
      metrics: "85% faster deployments",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "VP Sales Operations",
      company: "HubSpot",
      industry: "Sales & Marketing",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
      quote: "Our lead qualification process is now fully automated. Tredy routes 10,000+ leads daily across Salesforce, Slack, and our CRM with 94% accuracy.",
      metrics: "300% more qualified leads",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "Head of Finance",
      company: "Stripe",
      industry: "Financial Services",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
      quote: "Tredy connects our payment systems, compliance tools, and reporting dashboards. Monthly financial close went from 15 days to 3 days.",
      metrics: "80% faster financial close",
      rating: 5
    },
    {
      name: "David Kim",
      role: "Director of Operations",
      company: "Shopify",
      industry: "E-commerce",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
      quote: "Our order fulfillment workflows now handle 100K+ daily orders automatically. Inventory, shipping, and customer service all sync perfectly.",
      metrics: "92% order automation",
      rating: 5
    }
  ];

  const industryWorkflows = {
    "Technology": {
      title: "Software Development & DevOps",
      description: "Automate CI/CD, code reviews, deployment, and incident response",
      companies: ["GitHub", "Atlassian", "Docker", "MongoDB"],
      connectors: [
        { name: "GitHub", icon: "🐙", workflow: "Auto-PR reviews" },
        { name: "Jira", icon: "📊", workflow: "Issue tracking" },
        { name: "Slack", icon: "💬", workflow: "Team alerts" },
        { name: "AWS", icon: "☁️", workflow: "Infrastructure" },
        { name: "Datadog", icon: "📈", workflow: "Monitoring" },
        { name: "PagerDuty", icon: "🚨", workflow: "Incident response" }
      ],
      metrics: "85% faster deployments, 60% fewer bugs"
    },
    "Finance": {
      title: "Financial Operations & Compliance", 
      description: "Streamline accounting, compliance reporting, and financial planning",
      companies: ["Stripe", "Square", "Coinbase", "Robinhood"],
      connectors: [
        { name: "QuickBooks", icon: "💰", workflow: "Accounting automation" },
        { name: "Stripe", icon: "💳", workflow: "Payment processing" },
        { name: "Salesforce", icon: "☁️", workflow: "Revenue tracking" },
        { name: "Tableau", icon: "📊", workflow: "Financial reporting" },
        { name: "DocuSign", icon: "📄", workflow: "Contract approval" },
        { name: "Workday", icon: "👥", workflow: "Expense management" }
      ],
      metrics: "80% faster month-end close, 95% compliance accuracy"
    },
    "Sales": {
      title: "Sales & Revenue Operations",
      description: "Automate lead routing, opportunity management, and customer onboarding", 
      companies: ["HubSpot", "Salesforce", "Zoom", "Calendly"],
      connectors: [
        { name: "Salesforce", icon: "☁️", workflow: "Lead management" },
        { name: "HubSpot", icon: "🔧", workflow: "Marketing automation" },
        { name: "Zoom", icon: "🎥", workflow: "Meeting scheduling" },
        { name: "DocuSign", icon: "📄", workflow: "Contract signing" },
        { name: "Slack", icon: "💬", workflow: "Team notifications" },
        { name: "Gmail", icon: "📧", workflow: "Email sequences" }
      ],
      metrics: "300% more qualified leads, 45% shorter sales cycle"
    },
    "Ecommerce": {
      title: "E-commerce & Retail Operations",
      description: "Automate inventory, fulfillment, customer service, and marketing",
      companies: ["Shopify", "Amazon", "Etsy", "BigCommerce"],
      connectors: [
        { name: "Shopify", icon: "🛒", workflow: "Order processing" },
        { name: "Amazon", icon: "📦", workflow: "Fulfillment" },
        { name: "Zendesk", icon: "🎧", workflow: "Customer support" },
        { name: "Mailchimp", icon: "📧", workflow: "Email marketing" },
        { name: "Google Ads", icon: "📢", workflow: "Ad optimization" },
        { name: "ShipStation", icon: "🚚", workflow: "Shipping automation" }
      ],
      metrics: "92% order automation, 40% increase in customer satisfaction"
    }
  };

  // Animated counter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedCount(prev => ({
        users: Math.min(prev.users + 250, 50000),
        integrations: Math.min(prev.integrations + 25, 500),
        uptime: Math.min(prev.uptime + 2, 99.9)
      }));
    }, 50);

    return () => clearTimeout(timer);
  }, [animatedCount]);

  // Testimonial rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % industryTestimonials.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Fetch waitlist count on mount
  useEffect(() => {
    const fetchWaitlistCount = async () => {
      try {
        const response = await fetch('/api/waitlist/count');
        if (response.ok) {
          const data = await response.json();
          setWaitlistCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching waitlist count:", error);
      }
    };

    fetchWaitlistCount();
  }, []);

  // Smart form validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    if (email.includes('+')) return "Business email preferred (avoid + aliases)";
    const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = email.split('@')[1];
    if (freeProviders.includes(domain)) return "Business email recommended for enterprise features";
    return "";
  };

  const validateCompany = (company) => {
    if (!company) return "Company name is required";
    if (company.length < 2) return "Company name seems too short";
    if (company.length > 100) return "Company name is too long";
    return "";
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handleCompanyChange = (e) => {
    const value = e.target.value;
    setCompany(value);
    setCompanyError(validateCompany(value));
  };

  const handleSmartSubmit = (e) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const companyErr = validateCompany(company);
    
    setEmailError(emailErr);
    setCompanyError(companyErr);
    
    if (!emailErr && !companyErr) {
      // Success - would integrate with backend
      alert('Thanks! We\'ll be in touch soon.');
      setEmail('');
      setCompany('');
      setShowSmartForm(false);
    }
  };

  // Onboarding steps
  const onboardingSteps = [
    {
      target: 'hero-cta',
      title: 'Welcome to Tredy! 🎉',
      content: 'Start your journey with our 30-day free trial. No credit card required.',
      position: 'bottom'
    },
    {
      target: 'industry-selector',
      title: 'Choose Your Industry',
      content: 'See workflows tailored to your specific industry and use case.',
      position: 'top'
    },
    {
      target: 'features-section',
      title: 'Explore Our Features',
      content: 'Click "Learn More" on any feature to see detailed capabilities.',
      position: 'top'
    },
    {
      target: 'pricing-section',
      title: 'Find Your Perfect Plan',
      content: 'Compare features and find the plan that scales with your business.',
      position: 'top'
    }
  ];

  const nextOnboardingStep = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      setShowOnboarding(false);
      setOnboardingStep(0);
    }
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingStep(0);
  };

  // Function to submit to waitlist
  const handleWaitlistSubmit = async () => {
    if (!waitlistEmail || !waitlistEmail.includes('@')) {
      setWaitlistError("Please enter a valid email address");
      return;
    }

    setWaitlistLoading(true);
    setWaitlistError("");

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: waitlistEmail }),
      });

      if (response.ok) {
        setWaitlistSuccess(true);
        setWaitlistEmail("");
        setWaitlistCount(prev => prev + 1);
        showToast("Thanks! You're on the waitlist. We'll notify you when Tredy is ready!", "success");
      } else {
        const errorData = await response.json();
        setWaitlistError(errorData.error || "Failed to join waitlist. Please try again.");
      }
    } catch (error) {
      console.error("Error joining waitlist:", error);
      setWaitlistError("Failed to join waitlist. Please try again.");
    } finally {
      setWaitlistLoading(false);
    }
  };

  // Function to create Tredy workspace (kept for demo button)
  const handleCreateTredyWorkspace = async () => {
    try {
      const { workspace, message } = await Workspace.new({
        name: "Tredy",
        onboardingComplete: true,
      });
      
      if (workspace) {
        showToast("Creating Tredy workspace...", "success");
        navigate(`/workspace/${workspace.slug}`);
      } else {
        showToast(message || "Failed to create workspace", "error");
        navigate("/login");
      }
    } catch (error) {
      console.error("Error creating workspace:", error);
      navigate("/login");
    }
  };

  // Tooltip component
  const Tooltip = ({ id, title, content, position = 'top', children }) => (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setActiveTooltip(id)}
        onMouseLeave={() => setActiveTooltip(null)}
        className="group"
      >
        {children}
      </div>
      {activeTooltip === id && (
        <div 
          className={`absolute z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl max-w-xs animate-fadeIn pointer-events-none ${
            position === 'top' ? 'bottom-full mb-2 left-1/2 transform -translate-x-1/2' :
            position === 'bottom' ? 'top-full mt-2 left-1/2 transform -translate-x-1/2' :
            position === 'left' ? 'right-full mr-2 top-1/2 transform -translate-y-1/2' :
            'left-full ml-2 top-1/2 transform -translate-y-1/2'
          }`}
          onMouseEnter={() => setActiveTooltip(id)}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <div className="font-semibold mb-1">{title}</div>
          <div>{content}</div>
          <div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
            position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
            position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
            position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
            'right-full top-1/2 -translate-y-1/2 -mr-1'
          }`}></div>
        </div>
      )}
    </div>
  );

  // Improved Color-Balanced Design System
  const designSystem = {
    spacing: {
      section: 'py-24',
      container: 'px-6',
      cardPadding: 'p-8',
      buttonPadding: 'px-8 py-4',
      gap: {
        small: 'gap-4',
        medium: 'gap-8', 
        large: 'gap-16'
      }
    },
    colors: {
      primary: 'from-purple-500 to-indigo-500',
      primaryHover: 'from-purple-600 to-indigo-600',
      secondary: 'from-purple-25 to-indigo-25',
      accent: 'from-purple-50 to-indigo-50',
      success: 'from-emerald-50 to-teal-50',
      warning: 'from-amber-50 to-orange-50',
      info: 'from-blue-50 to-cyan-50',
      neutral: 'from-gray-25 to-slate-25',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-700',
        muted: 'text-gray-600',
        light: 'text-gray-500'
      },
      brand: {
        purple: 'text-purple-700',
        indigo: 'text-indigo-700',
        emerald: 'text-emerald-700',
        amber: 'text-amber-700'
      }
    },
    typography: {
      hero: 'text-5xl lg:text-6xl xl:text-7xl font-bold',
      heading1: 'text-4xl lg:text-5xl font-bold',
      heading2: 'text-3xl lg:text-4xl font-bold', 
      heading3: 'text-2xl lg:text-3xl font-bold',
      body: 'text-lg lg:text-xl',
      bodySmall: 'text-base'
    },
    animations: {
      transition: 'transition-all duration-300',
      transitionFast: 'transition-all duration-200', 
      transitionSlow: 'transition-all duration-500',
      hover: 'hover:scale-105 hover:shadow-xl transform',
      hoverSubtle: 'hover:scale-102 hover:shadow-lg transform',
      fadeIn: 'animate-fadeIn',
      pulse: 'animate-pulse'
    },
    components: {
      card: 'bg-white rounded-3xl shadow-xl border border-slate-100',
      cardHover: 'hover:shadow-2xl hover:border-purple-200',
      button: {
        primary: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl',
        secondary: 'border-2 border-purple-200 text-purple-600 rounded-full font-bold hover:border-indigo-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-300',
        success: 'bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-full font-bold hover:from-emerald-500 hover:to-teal-500 transition-all duration-300',
        ghost: 'text-purple-600 hover:text-indigo-600 font-semibold transition-colors',
        outline: 'border-2 border-gray-300 text-gray-800 rounded-full font-bold hover:border-purple-300 hover:text-purple-700 transition-all duration-300'
      }
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Onboarding Overlay */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">{onboardingSteps[onboardingStep].title.match(/🎉|📊|🚀|💼/)?.[0] || '🎯'}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {onboardingSteps[onboardingStep].title.replace(/🎉|📊|🚀|💼/, '').trim()}
              </h3>
              <p className="text-gray-600">{onboardingSteps[onboardingStep].content}</p>
            </div>
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-2">
                {onboardingSteps.map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full ${i === onboardingStep ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                ))}
              </div>
              <span className="text-sm text-gray-500">{onboardingStep + 1} of {onboardingSteps.length}</span>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={skipOnboarding}
                className="flex-1 py-3 px-6 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:border-gray-300 transition-colors"
              >
                Skip Tour
              </button>
              <button 
                onClick={nextOnboardingStep}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
              >
{onboardingStep === onboardingSteps.length - 1 ? t('common.getStarted') : t('common.next')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Button */}
      <button 
        onClick={() => setShowOnboarding(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
      >
        <span className="text-xl">?</span>
      </button>

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-20 left-20 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-purple-100/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/tredy_logo_name_slogan_purple.PNG" 
                alt="Tredy" 
                className="h-12 object-contain"
              />
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <div className="relative group">
                <button className="text-gray-600 hover:text-purple-700 font-medium transition-colors flex items-center">
                  Solutions
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute top-full left-0 w-64 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 mt-2">
                  <div className="p-4">
                    <a href="#" className="block px-3 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors">Enterprise AI</a>
                    <a href="#" className="block px-3 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors">Workflow Automation</a>
                    <a href="#" className="block px-3 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors">Integration Platform</a>
                  </div>
                </div>
              </div>
              <a href="#enterprise" className="text-gray-600 hover:text-purple-700 font-medium transition-colors">
                Enterprise
              </a>
              <a href="#security" className="text-gray-600 hover:text-purple-700 font-medium transition-colors">
                Security
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-purple-700 font-medium transition-colors">
                Pricing
              </a>
              <div className="relative group">
                <button className="text-gray-600 hover:text-purple-700 font-medium transition-colors flex items-center">
                  Resources
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute top-full left-0 w-48 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 mt-2">
                  <div className="p-4">
                    <a href="#" className="block px-3 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors">Documentation</a>
                    <a href="#" className="block px-3 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors">API Reference</a>
                    <a href="#" className="block px-3 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors">Case Studies</a>
                    <a href="#" className="block px-3 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors">Blog</a>
                  </div>
                </div>
              </div>
              
              {/* Language Toggle */}
              <div className="relative">
                <select
                  value={currentLanguage || "en"}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="appearance-none bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm px-3 py-2 rounded-lg border border-gray-200 hover:border-purple-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 cursor-pointer"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {getLanguageName(lang)}
                    </option>
                  ))}
                </select>
                <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
              
              <Link 
                to="/login"
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full font-semibold hover:from-purple-600 hover:to-purple-700 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
{t('landing.cta.startTrial')}
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-purple-700 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-100 py-4">
              <div className="space-y-2">
                <a href="#solutions" className="block px-4 py-2 text-gray-700 hover:text-purple-700 transition-colors">Solutions</a>
                <a href="#enterprise" className="block px-4 py-2 text-gray-700 hover:text-purple-700 transition-colors">Enterprise</a>
                <a href="#security" className="block px-4 py-2 text-gray-700 hover:text-purple-700 transition-colors">Security</a>
                <a href="#pricing" className="block px-4 py-2 text-gray-700 hover:text-purple-700 transition-colors">Pricing</a>
                <a href="#resources" className="block px-4 py-2 text-gray-700 hover:text-purple-700 transition-colors">Resources</a>
                
                {/* Mobile Language Toggle */}
                <div className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <select
                      value={currentLanguage || "en"}
                      onChange={(e) => changeLanguage(e.target.value)}
                      className="flex-1 appearance-none bg-gray-50 text-gray-700 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      {supportedLanguages.map((lang) => (
                        <option key={lang} value={lang}>
                          {getLanguageName(lang)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <Link to="/login" className="block mx-4 mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full font-semibold text-center">
  {t('landing.cta.startTrial')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-20 lg:pt-24 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 min-h-[95vh] sm:min-h-screen flex items-center overflow-hidden">
        {/* Agentic Background Elements */}
        <div className="absolute inset-0 -z-10">
          {/* Vibrant Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 via-blue-50/30 to-indigo-100/40"></div>
          
          {/* Agentic Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
          
          {/* Vibrant Light Rays */}
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-blue-300/30 via-purple-300/20 to-transparent"></div>
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-indigo-300/30 via-blue-300/20 to-transparent"></div>
          
          {/* Subtle Color Accents */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/10 to-purple-200/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-indigo-200/10 to-blue-200/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 lg:gap-20 items-center">
            {/* Left: Hero Content */}
            <div className="text-center lg:text-left space-y-8">
              {/* Elegant Badge */}
              <div className="premium-badge inline-flex items-center px-4 py-2 mb-8 bg-white/70 backdrop-blur-sm text-purple-800 rounded-full text-sm font-semibold border border-purple-200/40 hover:scale-105 transition-all duration-300 shadow-lg">
                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mr-3"></div>
                <span className="text-purple-600 dark:text-purple-400 font-semibold">
                  AI-First Enterprise Platform
                </span>
              </div>
              
              {/* Agentic Title */}
              <div className="space-y-6">
                <h1 className="hero-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
                  <span className="hero-title block mb-3 text-slate-800">
                    {t('landing.hero.title')}
                  </span>
                  <span className="hero-title block text-purple-600 dark:text-purple-400 animate-gradient-x relative">
                    {t('landing.hero.subtitle')}
                    <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-purple-400/30 to-indigo-400/30 rounded-full animate-pulse"></div>
                  </span>
                </h1>
              </div>
              
              {/* Agentic Description */}
              <div className="space-y-4">
                <p className="hero-description text-lg sm:text-xl lg:text-2xl text-slate-700 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                  Transform your business with <span className="text-purple-600 font-semibold">intelligent automation</span> that connects every tool, understands context, and scales infinitely.
                </p>
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <div className="px-3 py-1 bg-purple-50/50 rounded-full text-sm text-purple-700 font-medium border border-purple-200/30">
                    Intelligent Agents
                  </div>
                  <div className="px-3 py-1 bg-indigo-50/50 rounded-full text-sm text-indigo-700 font-medium border border-indigo-200/30">
                    Context Aware
                  </div>
                  <div className="px-3 py-1 bg-emerald-50/50 rounded-full text-sm text-emerald-700 font-medium border border-emerald-200/30">
                    Infinite Scale
                  </div>
                </div>
              </div>
              
              {/* Agentic CTA Section */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start items-center">
                {/* Sleek Email Input */}
                <div className="relative group">
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-80 px-6 py-3 bg-white/60 backdrop-blur-sm border border-purple-200/40 text-slate-900 placeholder-slate-500 rounded-full text-sm focus:border-purple-400 focus:bg-white/80 transition-all duration-300 font-medium"
                    disabled={waitlistLoading}
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </div>
                
                {/* Shiny Blue Primary Button */}
                <button 
                  onClick={handleWaitlistSubmit}
                  disabled={waitlistLoading || !waitlistEmail}
                  className="group inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:hover:scale-100 relative overflow-hidden border border-blue-400/30 hover:border-blue-300/50"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)',
                    borderRadius: '0'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-400/30 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50"></div>
                  {waitlistLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin mr-3" />
                      <span className="relative z-10 font-medium tracking-wide">INITIALIZING...</span>
                    </>
                  ) : waitlistSuccess ? (
                    <>
                      <CheckCircle className="mr-3 w-4 h-4 relative z-10" />
                      <span className="relative z-10 font-medium tracking-wide">ACTIVATED</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10 font-medium tracking-wide">JOIN WAITLIST</span>
                      <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
                    </>
                  )}
                </button>
                
                {/* Agentic Secondary Button */}
                <button 
                  onClick={handleCreateTredyWorkspace}
                  className="group inline-flex items-center px-8 py-3 bg-white/60 backdrop-blur-sm border border-purple-300/40 text-purple-700 hover:border-purple-400/60 hover:bg-white/80 text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 relative overflow-hidden"
                  style={{
                    clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 50%, 100% 100%, 8px 100%, 0 50%)',
                    borderRadius: '0'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-50/0 via-purple-50/40 to-purple-50/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-100/20 to-indigo-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Play className="mr-3 w-4 h-4 group-hover:scale-110 transition-transform duration-300 relative z-10" />
                  <span className="relative z-10 font-medium tracking-wide">TRY DEMO</span>
                </button>
              </div>

              {/* Agentic Stats */}
              <div className="flex flex-wrap gap-8 justify-center lg:justify-start">
                <div className="text-center lg:text-left group cursor-pointer">
                  <div className="stat-number text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent mb-1 transition-all duration-300 group-hover:scale-110">
                    99.9%
                  </div>
                  <div className="text-sm text-slate-500 font-medium">
                    Uptime
                  </div>
                </div>
                <div className="text-center lg:text-left group cursor-pointer">
                  <div className="stat-number text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent mb-1 transition-all duration-300 group-hover:scale-110">
                    500+
                  </div>
                  <div className="text-sm text-slate-500 font-medium">
                    Integrations
                  </div>
                </div>
                <div className="text-center lg:text-left group cursor-pointer">
                  <div className="stat-number text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent mb-1 transition-all duration-300 group-hover:scale-110">
                    Enterprise
                  </div>
                  <div className="text-sm text-slate-500 font-medium">
                    Ready
                  </div>
                </div>
              </div>

            </div>

            {/* Right: Modern Chat Demo */}
            <div className="relative mt-12 lg:mt-0 w-full max-w-md lg:max-w-lg mx-auto lg:mx-0">
              <ChatDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Industry Solutions Section */}
      <section className={`${designSystem.spacing.section} ${designSystem.spacing.container} bg-gray-50`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className={`inline-flex items-center ${designSystem.spacing.buttonPadding} mb-8 bg-white/90 backdrop-blur-md text-purple-700 rounded-full text-sm font-bold border border-purple-200 shadow-lg`}>
              <Users className="w-5 h-5 mr-2" />
              Industry Solutions
            </div>
            <h2 className={`${designSystem.typography.heading1} text-gray-900 dark:text-white mb-6`}>
              Built for Your <span className="text-purple-600 dark:text-purple-400">Industry</span>
            </h2>
            <p className={`${designSystem.typography.body} text-gray-700 dark:text-gray-300 max-w-4xl mx-auto`}>
              Experience how Tredy AI creates intelligent business platforms tailored to your specific industry needs
            </p>
          </div>

          {/* Industry Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {['Real Estate', 'Healthcare', 'E-commerce', 'Finance', 'Manufacturing', 'Education'].map((industry) => (
              <button
                key={industry}
                onClick={() => setSelectedIndustry(industry)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                  selectedIndustry === industry
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:text-purple-700 hover:shadow-md'
                }`}
              >
                {industry}
              </button>
            ))}
          </div>

          {/* Business Platform Demo */}
          <div className="flex justify-center mb-16">
            <BusinessChat selectedIndustry={selectedIndustry} />
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Transform Your Industry?
              </h3>
              <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
                Tredy AI adapts to your specific industry needs, creating intelligent workflows 
                that understand your business processes and automate complex tasks.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-colors duration-300">
                  Start Your Industry Solution
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-purple-600 transition-colors duration-300">
                  View All Industries
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

    

      {/* AI Enterprise Platform Section */}
      <AIEnterprisePlatform />

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 text-center mb-16">
            Frequently Asked
            <span className="text-purple-600 dark:text-purple-400"> Questions</span>
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-purple-300 hover:shadow-lg transition-all duration-300">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-purple-50 transition-colors duration-200"
                >
                  <span className="font-bold text-gray-900 text-lg">{faq.question}</span>
                  {expandedFaq === i ? 
                    <ChevronUp className="w-6 h-6 text-purple-600" /> : 
                    <ChevronDown className="w-6 h-6 text-purple-600" />
                  }
                </button>
                {expandedFaq === i && (
                  <div className="px-8 pb-6 animate-fadeIn">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section with Smart Form */}
      <section className="py-24 px-6 bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-8">
            Ready to Transform Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400" style={{WebkitBackgroundClip: 'text', backgroundClip: 'text'}}>Workflow?</span>
          </h2>
          <p className="text-2xl text-purple-100 mb-12 max-w-2xl mx-auto">
            Join thousands of teams automating with Tredy
          </p>
          
          {!showSmartForm ? (
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
              <Link 
                to="/login"
                className="inline-flex items-center px-10 py-5 bg-white text-purple-700 rounded-full text-xl font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
{t('landing.cta.getStartedFree')}
                <ArrowRight className="ml-3 w-6 h-6" />
              </Link>
              <button 
                onClick={() => setShowSmartForm(true)}
                className="inline-flex items-center px-10 py-5 bg-purple-400/20 backdrop-blur-md text-white border-2 border-white/30 rounded-full text-xl font-bold hover:bg-purple-300/30 transition-all duration-300 transform hover:scale-105"
              >
                Schedule Demo
              </button>
            </div>
          ) : (
            <div className="max-w-md mx-auto mb-8">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Get Your Personal Demo</h3>
                <form onSubmit={handleSmartSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Business Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                        emailError 
                          ? 'border-red-300 focus:border-red-500' 
                          : email && !emailError 
                            ? 'border-green-300 focus:border-green-500'
                            : 'border-gray-200 focus:border-purple-500'
                      } focus:outline-none`}
                      placeholder="you@yourcompany.com"
                    />
                    {emailError && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span>⚠️</span> {emailError}
                      </p>
                    )}
                    {email && !emailError && (
                      <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                        <span>✅</span> Great! We'll set up industry-specific examples.
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={handleCompanyChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                        companyError 
                          ? 'border-red-300 focus:border-red-500' 
                          : company && !companyError 
                            ? 'border-green-300 focus:border-green-500'
                            : 'border-gray-200 focus:border-purple-500'
                      } focus:outline-none`}
                      placeholder="Your Company"
                    />
                    {companyError && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span>⚠️</span> {companyError}
                      </p>
                    )}
                    {company && !companyError && (
                      <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                        <span>✅</span> Perfect! We'll prepare a custom demo.
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={emailError || companyError || !email || !company}
                      className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-200 ${
                        emailError || companyError || !email || !company
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transform hover:scale-105'
                      }`}
                    >
                      Schedule Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSmartForm(false)}
                      className="px-4 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:border-gray-300 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center pt-2">
                    🔒 Your information is secure and will never be shared
                  </p>
                </form>
              </div>
            </div>
          )}
          
          <div className="text-center">
            <p className="text-purple-100 text-lg">
              ⚡ 30-second setup • 🎯 Instant ROI • 🛡️ Enterprise security
            </p>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-gradient-to-r from-purple-600 to-purple-700">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center mb-4 sm:mb-6">
                <img 
                  src="/tredy_logo_name_slogan_purple.PNG" 
                  alt="Tredy" 
                  className="h-12 sm:h-16 object-contain"
                />
              </div>
              <p className="text-purple-100 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 max-w-md">
                The future of intelligent workflows. Connect, visualize, and execute through AI-powered threads.
              </p>
              <div className="flex space-x-4">
                {['twitter', 'linkedin', 'github'].map((social) => (
                  <a key={social} href="#" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:text-purple-200 hover:bg-white/30 transition-colors">
                    <span className="sr-only">{social}</span>
                    <div className="w-5 h-5 bg-current"></div>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Product</h3>
              <ul className="space-y-3">
                {['Features', 'Integrations', 'Security', 'API', 'Pricing'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Company</h3>
              <ul className="space-y-3">
                {['About', 'Blog', 'Careers', 'Contact', 'Support'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="pt-6 sm:pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-gray-400 text-xs sm:text-sm">
              © 2024 Tredy. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6 text-xs sm:text-sm text-gray-400">
              <a href="#" className="hover:text-purple-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-purple-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-purple-400 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style>{`
        .fixed-chat-container {
          height: 400px !important;
          max-height: 400px !important;
        }
        
        @media (min-width: 640px) {
          .fixed-chat-container {
            height: 500px !important;
            max-height: 500px !important;
          }
        }
        
        @media (min-width: 1024px) {
          .fixed-chat-container {
            height: 600px !important;
            max-height: 600px !important;
          }
        }
        
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-gradient-x {
          animation: gradient-x 6s ease infinite;
        }
      `}</style>
    </div>
  );
}