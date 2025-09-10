import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  TrendingUp,
  Lock,
  Cloud,
  BarChart
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguageOptions } from "@/hooks/useLanguageOptions";
import ChatDemo from "./ChatDemo";

export default function LandingPage() {
  const { t } = useTranslation();
  const { currentLanguage, supportedLanguages, getLanguageName, changeLanguage } = useLanguageOptions();
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [animatedCount, setAnimatedCount] = useState({ users: 0, integrations: 0, uptime: 0 });
  const [selectedIndustry, setSelectedIndustry] = useState("Technology");
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

  // Tooltip component
  const Tooltip = ({ id, title, content, position = 'top', children }) => (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setActiveTooltip(id)}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        {children}
      </div>
      {activeTooltip === id && (
        <div className={`absolute z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl max-w-xs animate-fadeIn ${
          position === 'top' ? 'bottom-full mb-2 left-1/2 transform -translate-x-1/2' :
          position === 'bottom' ? 'top-full mt-2 left-1/2 transform -translate-x-1/2' :
          position === 'left' ? 'right-full mr-2 top-1/2 transform -translate-y-1/2' :
          'left-full ml-2 top-1/2 transform -translate-y-1/2'
        }`}>
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
        <div className="absolute top-40 left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
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
      <section className={`relative pt-32 pb-20 ${designSystem.spacing.container} min-h-screen flex items-center`}>
        <div className="max-w-7xl mx-auto">
          <div className={`grid lg:grid-cols-2 ${designSystem.spacing.gap.large} items-center`}>
            {/* Left: Hero Content */}
            <div className="text-center lg:text-left">
              <div className={`inline-flex items-center ${designSystem.spacing.buttonPadding} mb-8 bg-gradient-to-r ${designSystem.colors.secondary} ${designSystem.colors.text.primary} rounded-full text-sm font-semibold border border-purple-200 ${designSystem.animations.fadeIn} hover:scale-105 transition-all duration-300 shadow-sm`}>
                <Sparkles className="w-4 h-4 mr-2 animate-spin text-purple-600" />
                #1 Enterprise AI Automation Platform
                <div className="ml-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
              
              <h1 className={`${designSystem.typography.hero} ${designSystem.colors.text.primary} mb-8 leading-[1.1]`}>
                <span className="block">{t('landing.hero.title')}</span>
                <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent animate-gradient-x" style={{WebkitBackgroundClip: 'text', backgroundClip: 'text'}}>
                  {t('landing.hero.subtitle')}
                </span>
              </h1>
              
              <p className={`${designSystem.typography.body} ${designSystem.colors.text.secondary} mb-12 leading-relaxed max-w-2xl mx-auto lg:mx-0`}>
                {t('landing.hero.description')}
              </p>
              
              <div id="hero-cta" className={`flex flex-col sm:flex-row ${designSystem.spacing.gap.small} justify-center lg:justify-start mb-16`}>
                <Tooltip 
                  id="free-trial" 
                  title="Free Trial Benefits" 
                  content="No credit card required • Full access to all features • Cancel anytime • Dedicated support included"
                  position="bottom"
                >
                  <Link 
                    to="/login"
                    className={`group inline-flex items-center px-10 py-5 ${designSystem.components.button.primary} text-xl`}
                  >
                    Chat with Tredy
                    <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Tooltip>
                <Tooltip 
                  id="demo-video" 
                  title="Interactive Demo" 
                  content="See Tredy in action with real-world scenarios from your industry"
                  position="bottom"
                >
                  <button className={`group inline-flex items-center px-10 py-5 bg-white/90 backdrop-blur-sm ${designSystem.components.button.secondary} text-xl`}>
                    <Play className="mr-3 w-6 h-6 group-hover:scale-110 transition-transform" />
                    Watch Demo
                  </button>
                </Tooltip>
              </div>

              {/* Enhanced Animated Stats with Balanced Colors */}
              <div className={`grid grid-cols-3 ${designSystem.spacing.gap.medium} mb-8`}>
                <div className="text-center lg:text-left group">
                  <div className={`${designSystem.typography.heading2} ${designSystem.colors.brand.purple} mb-2 transition-all duration-300 group-hover:scale-110`}>
                    {animatedCount.integrations.toLocaleString()}+
                  </div>
                  <div className={`text-sm ${designSystem.colors.text.muted} font-medium`}>Integrations</div>
                  <div className="text-xs text-emerald-600 font-semibold mt-1">
                    <span className="inline-block w-1 h-1 bg-emerald-500 rounded-full mr-1 animate-pulse"></span>
                    +12 this week
                  </div>
                </div>
                <div className="text-center lg:text-left group">
                  <div className={`${designSystem.typography.heading2} ${designSystem.colors.brand.indigo} mb-2 transition-all duration-300 group-hover:scale-110`}>
                    {animatedCount.users.toLocaleString()}+
                  </div>
                  <div className={`text-sm ${designSystem.colors.text.muted} font-medium`}>Enterprise Users</div>
                  <div className="text-xs text-teal-600 font-semibold mt-1">
                    <span className="inline-block w-1 h-1 bg-teal-500 rounded-full mr-1 animate-pulse"></span>
                    +247 today
                  </div>
                </div>
                <div className="text-center lg:text-left group">
                  <div className={`${designSystem.typography.heading2} ${designSystem.colors.brand.emerald} mb-2 transition-all duration-300 group-hover:scale-110`}>
                    {animatedCount.uptime.toFixed(1)}%
                  </div>
                  <div className={`text-sm ${designSystem.colors.text.muted} font-medium`}>Uptime SLA</div>
                  <div className="text-xs text-emerald-600 font-semibold mt-1">
                    <span className="inline-block w-1 h-1 bg-emerald-500 rounded-full mr-1 animate-pulse"></span>
                    30 days streak
                  </div>
                </div>
              </div>

              {/* Live Activity Feed */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${designSystem.colors.text.primary}`}>Sarah from Atlassian</div>
                      <div className={`text-xs ${designSystem.colors.text.muted}`}>Just started their automation workflow</div>
                    </div>
                  </div>
                  <div className={`text-xs ${designSystem.colors.text.muted}`}>2 min ago</div>
                </div>
              </div>
            </div>

            {/* Right: Enhanced Chat Demo */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative">
                <ChatDemo />
              </div>
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
            <h2 className={`${designSystem.typography.heading1} ${designSystem.colors.text.primary} mb-6`}>
              Built for Your
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" style={{WebkitBackgroundClip: 'text', backgroundClip: 'text'}}> Industry</span>
            </h2>
            <p className={`${designSystem.typography.body} ${designSystem.colors.text.secondary} max-w-4xl mx-auto`}>
              Pre-built workflows and integrations for your specific business needs
            </p>
          </div>

          {/* Industry Tab Selector - Compact */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {Object.keys(industryWorkflows).map((industry) => (
              <button
                key={industry}
                onClick={() => setSelectedIndustry(industry)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 cursor-pointer text-sm ${
                  selectedIndustry === industry
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:text-purple-700 hover:shadow-md'
                }`}
              >
                {industry}
              </button>
            ))}
          </div>

          {/* Live Automation Showcase */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            
            {/* Left: Live Workflow Cards */}
            <div className="space-y-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">Available Integrations</h3>
              </div>

              {/* Simple Integration Cards */}
              {industryWorkflows[selectedIndustry].connectors.slice(0, 4).map((connector, idx) => (
                <div 
                  key={idx}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-xl">
                      {connector.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{connector.name}</h4>
                      <p className="text-sm text-gray-600">{connector.workflow}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Industry Overview */}
            <div className="lg:sticky lg:top-8">
              <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">{industryWorkflows[selectedIndustry].title}</h3>
                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-semibold">500+ companies</span>
                    </div>
                  </div>
                  <p className="text-purple-100 leading-relaxed">
                    {industryWorkflows[selectedIndustry].description}
                  </p>
                </div>

                {/* Metrics Dashboard */}
                <div className="p-6">
                  <h4 className="font-bold text-gray-900 mb-4">
                    Key Results
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
                      <div className="text-2xl font-bold text-emerald-700">
                        {industryWorkflows[selectedIndustry].metrics.split(',')[0].replace(/[^\d]/g, '')}%
                      </div>
                      <div className="text-xs text-emerald-600 font-medium">Performance Boost</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl">
                      <div className="text-2xl font-bold text-purple-700">
                        500+
                      </div>
                      <div className="text-xs text-purple-600 font-medium">Companies Trust Us</div>
                    </div>
                  </div>

                  {/* Featured Companies */}
                  <div className="mb-6">
                    <h5 className="font-semibold text-gray-900 mb-3">Trusted by Industry Leaders</h5>
                    <div className="flex flex-wrap gap-2">
                      {industryWorkflows[selectedIndustry].companies.map((company, ci) => (
                        <span key={ci} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <button className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 flex items-center justify-center gap-2">
                      <Play className="w-4 h-4" />
                      Watch {selectedIndustry} Demo
                    </button>
                    <button className="w-full border-2 border-purple-200 text-purple-700 py-3 px-6 rounded-xl font-semibold hover:border-purple-300 hover:bg-purple-50 transition-all duration-200">
                      View Workflow Templates
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

            {/* Clean Industry Content Display */}
            <div className={`${designSystem.components.card} ${designSystem.components.cardHover} ${designSystem.spacing.cardPadding} max-w-6xl mx-auto transition-all duration-300`}>
              {/* Industry Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <h3 className={`${designSystem.typography.heading3} ${designSystem.colors.text.primary}`}>
                    {industryWorkflows[selectedIndustry].title}
                  </h3>
                  <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                    <TrendingUp className="w-4 h-4" />
                    {industryWorkflows[selectedIndustry].metrics.split(',')[0]}
                  </div>
                </div>
                <p className={`${designSystem.colors.text.secondary} mb-6`}>
                  {industryWorkflows[selectedIndustry].description}
                </p>
              </div>

              {/* Available Tools Grid */}
              <div className="mb-8">
                <h4 className={`text-lg font-bold ${designSystem.colors.text.primary} mb-4 text-center`}>
                  Available Tools & Integrations ({industryWorkflows[selectedIndustry].connectors.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {industryWorkflows[selectedIndustry].connectors.map((connector, ci) => (
                    <div 
                      key={ci} 
                      className="flex items-center gap-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-md cursor-pointer group border border-slate-200 hover:border-purple-200"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">{connector.icon}</span>
                      <div>
                        <div className={`font-semibold text-sm ${designSystem.colors.text.primary}`}>{connector.name}</div>
                        <div className={`text-xs ${designSystem.colors.text.muted}`}>{connector.workflow}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Usage Stats */}
              <div className="bg-gradient-to-r from-slate-50 to-purple-50 rounded-xl p-6 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className={`${designSystem.colors.text.secondary}`}>
                      <span className={`font-bold ${designSystem.colors.brand.emerald}`}>1,247</span> workflows running
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Users className={`w-4 h-4 ${designSystem.colors.brand.indigo}`} />
                    <span className={`${designSystem.colors.text.secondary}`}>
                      <span className={`font-bold ${designSystem.colors.brand.indigo}`}>500+</span> companies
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Award className={`w-4 h-4 ${designSystem.colors.brand.amber}`} />
                    <span className={`${designSystem.colors.text.secondary}`}>
                      <span className={`font-bold ${designSystem.colors.brand.amber}`}>{industryWorkflows[selectedIndustry].metrics.split(',')[1] || '95% satisfaction'}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 max-w-4xl mx-auto">
              <h3 className={`${designSystem.typography.heading3} ${designSystem.colors.text.primary} mb-4`}>
                Ready to See Your Industry in Action?
              </h3>
              <p className={`${designSystem.colors.text.secondary} mb-8`}>
                Get a personalized demo with workflows tailored to your specific business needs
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className={`${designSystem.spacing.buttonPadding} ${designSystem.components.button.primary} text-lg`}>
                  {t('landing.cta.startTrial')}
                </button>
                <button className={`${designSystem.spacing.buttonPadding} ${designSystem.components.button.secondary} text-lg`}>
                  Book Custom Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Customer Success Stories */}
      <section className={`${designSystem.spacing.section} ${designSystem.spacing.container} bg-white`}>
        <div className="max-w-6xl mx-auto">

          {/* Industry Success Stories Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="flex -space-x-2">
                {industryTestimonials.slice(0, 4).map((testimonial, i) => (
                  <img 
                    key={i}
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  />
                ))}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-bold text-purple-700">1,247+</span> success stories
              </div>
            </div>
            
            <h2 className={`${designSystem.typography.heading1} ${designSystem.colors.text.primary} mb-6`}>
              Real Results from
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" style={{WebkitBackgroundClip: 'text', backgroundClip: 'text'}}> Real Companies</span>
            </h2>
            <p className={`${designSystem.typography.body} ${designSystem.colors.text.secondary} mb-4`}>See how industry leaders achieve measurable results with Tredy</p>
            
            {/* Trust Indicators */}
            <div className="flex justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>4.9/5 on G2</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4 text-purple-600" />
                <span>Leader in Automation</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-600" />
                <span>SOC 2 Certified</span>
              </div>
            </div>
          </div>

          {/* Enhanced Testimonial Carousel */}
          <div className={`bg-gradient-to-br ${designSystem.colors.secondary} rounded-3xl ${designSystem.spacing.cardPadding} shadow-xl border border-purple-100 max-w-5xl mx-auto relative overflow-hidden`}>
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 to-transparent rounded-bl-full opacity-30"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-200 to-transparent rounded-tr-full opacity-30"></div>
            
            <div className="text-center mb-8 relative z-10">
              {/* Rating and Verification */}
              <div className="flex justify-center items-center gap-4 mb-6">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-7 h-7 text-yellow-400 fill-current animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                  ))}
                </div>
                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  Verified Review
                </div>
              </div>
              
              <div className={`${designSystem.components.card} p-6 mb-6 relative`}>
                {/* Quote Icon */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">"</span>
                </div>
                
                <blockquote className={`${designSystem.typography.heading3} ${designSystem.colors.text.primary} font-medium mb-4 leading-relaxed italic`}>
                  "{industryTestimonials[currentTestimonial].quote}"
                </blockquote>
                
                {/* Results Badge */}
                <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-green-200 text-green-700 ${designSystem.spacing.buttonPadding} rounded-full font-bold text-sm shadow-sm`}>
                  <TrendingUp className="w-4 h-4" />
                  {industryTestimonials[currentTestimonial].metrics}
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <img 
                  src={industryTestimonials[currentTestimonial].image} 
                  alt={industryTestimonials[currentTestimonial].name}
                  className="w-20 h-20 rounded-full mr-6 border-4 border-purple-200 shadow-lg"
                />
                <div className="text-left">
                  <div className={`font-bold ${designSystem.typography.heading3} ${designSystem.colors.text.primary}`}>{industryTestimonials[currentTestimonial].name}</div>
                  <div className={`${designSystem.colors.text.secondary} ${designSystem.typography.body}`}>{industryTestimonials[currentTestimonial].role}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`text-purple-600 ${designSystem.typography.body} font-bold`}>{industryTestimonials[currentTestimonial].company}</div>
                    <span className={`${designSystem.colors.text.muted}`}>•</span>
                    <div className={`${designSystem.colors.text.muted} text-sm font-medium`}>{industryTestimonials[currentTestimonial].industry}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`flex justify-center ${designSystem.spacing.gap.small}`}>
              {industryTestimonials.map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentTestimonial(i)}
                  className={`w-4 h-4 rounded-full ${designSystem.animations.transition} ${
                    i === currentTestimonial ? 'bg-purple-600 scale-110' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features-section" className={`${designSystem.spacing.section} ${designSystem.spacing.container} bg-gradient-to-br from-purple-50 via-white to-pink-50 relative overflow-hidden`}>
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-40 right-20 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 mb-8 bg-white/90 backdrop-blur-md text-purple-700 rounded-full text-sm font-bold border border-purple-200 shadow-lg hover:scale-105 transition-transform">
              <Brain className="w-5 h-5 mr-2 animate-pulse" />
              AI-First Enterprise Platform
              <div className="ml-2 flex gap-1">
                <div className="w-1 h-1 bg-purple-600 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-1 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
            
            <h2 className={`${designSystem.typography.heading1} ${designSystem.colors.text.primary} mb-8`}>
              Enterprise AI That
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" style={{WebkitBackgroundClip: 'text', backgroundClip: 'text'}}> Actually Works</span>
            </h2>
            
            <p className={`${designSystem.typography.body} ${designSystem.colors.text.secondary} max-w-4xl mx-auto leading-relaxed mb-8`}>
              Built from the ground up for enterprise scale, security, and compliance. Connect every system, automate complex workflows, and maintain complete control.
            </p>
            
            {/* Feature Stats */}
            <div className="flex justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">
                  <span className="font-bold text-purple-700">99.9%</span> Uptime
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">
                  <span className="font-bold text-purple-700">500+</span> Integrations
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">
                  <span className="font-bold text-purple-700">Enterprise</span> Ready
                </span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                id: 'integration',
                icon: Globe,
                title: 'Universal Integration Hub',
                summary: 'Connect 500+ enterprise systems with certified security.',
                details: [
                  'Pre-built connectors for Salesforce, SAP, Oracle, and 500+ more',
                  'Real-time bidirectional sync with conflict resolution',
                  'Custom API development and legacy system integration',
                  'Enterprise-grade rate limiting and error handling',
                  'Webhook management and event-driven automation'
                ],
                metric: '99.9% API uptime',
                color: 'from-blue-600 to-blue-700'
              },
              {
                id: 'ai',
                icon: Brain,
                title: 'Advanced AI Reasoning',
                summary: 'Multi-step reasoning with persistent memory.',
                details: [
                  'Context-aware decision making across multiple systems',
                  'Learning from historical workflows and outcomes',
                  'Natural language to complex workflow translation',
                  'Predictive automation based on usage patterns',
                  'Multi-modal understanding (text, images, documents)'
                ],
                metric: 'GPT-4 powered',
                color: 'from-purple-600 to-purple-700'
              },
              {
                id: 'security',
                icon: Shield,
                title: 'Zero-Trust Security',
                summary: 'SOC 2 Type II, GDPR compliant, end-to-end encryption.',
                details: [
                  'AES-256 encryption for data at rest and in transit',
                  'Role-based access control with granular permissions',
                  'Complete audit trails and compliance reporting',
                  'On-premise and private cloud deployment options',
                  'Regular penetration testing and security audits'
                ],
                metric: 'Bank-grade security',
                color: 'from-green-600 to-green-700'
              }
            ].map((feature, i) => (
              <div key={i} className="group">
                <div className="bg-white/70 backdrop-blur-md border border-white/20 rounded-3xl p-8 hover:bg-white/90 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 to-transparent rounded-bl-full opacity-50"></div>
                  <div className="relative">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {feature.summary}
                    </p>
                    
                    {/* Progressive Disclosure */}
                    <button 
                      onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                      className="text-purple-600 hover:text-purple-700 font-semibold text-sm flex items-center gap-2 mb-4 transition-colors"
                    >
                      {expandedFeature === feature.id ? 'Show Less' : 'Learn More'}
                      {expandedFeature === feature.id ? 
                        <ChevronUp className="w-4 h-4" /> : 
                        <ChevronDown className="w-4 h-4" />
                      }
                    </button>
                    
                    {expandedFeature === feature.id && (
                      <div className="bg-white/90 rounded-xl p-4 mb-6 animate-fadeIn border border-purple-100">
                        <ul className="space-y-2">
                          {feature.details.map((detail, di) => (
                            <li key={di} className="flex items-start gap-2 text-sm text-gray-700">
                              <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex items-center text-purple-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                      <span>{feature.metric}</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Showcase */}
      <section id="integrations" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 mb-8 bg-purple-50 text-purple-700 rounded-full text-sm font-bold border border-purple-200">
              <Globe className="w-5 h-5 mr-2" />
              500+ Enterprise Integrations
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-8">
              Your Entire Tech Stack,
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" style={{WebkitBackgroundClip: 'text', backgroundClip: 'text'}}> Connected</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-12">
              From legacy systems to modern SaaS, everything connects securely through our unified API layer with real-time synchronization.
            </p>
          </div>

          {/* Popular Enterprise Integrations */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Most Popular Enterprise Integrations</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
              {[
                { name: "Salesforce", icon: "☁️", users: "45K+" },
                { name: "GitHub", icon: "🐙", users: "38K+" },
                { name: "Slack", icon: "💬", users: "52K+" },
                { name: "AWS", icon: "☁️", users: "29K+" },
                { name: "Jira", icon: "📊", users: "41K+" },
                { name: "Stripe", icon: "💳", users: "22K+" }
              ].map((app, i) => (
                <div
                  key={i}
                  className="group bg-white rounded-2xl p-6 flex flex-col items-center justify-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-purple-300 relative"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${i * 0.1}s both`
                  }}
                >
                  <div className="absolute top-2 right-2 bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full">
                    {app.users}
                  </div>
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{app.icon}</div>
                  <span className="text-sm text-gray-700 font-bold">{app.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Industry Integration Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-3xl font-bold text-purple-700 mb-2">500+</div>
              <div className="text-sm text-gray-600 font-medium">Total Integrations</div>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-3xl font-bold text-purple-700 mb-2">15</div>
              <div className="text-sm text-gray-600 font-medium">Industry Verticals</div>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-3xl font-bold text-purple-700 mb-2">99.9%</div>
              <div className="text-sm text-gray-600 font-medium">API Uptime</div>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-3xl font-bold text-purple-700 mb-2">&lt; 30s</div>
              <div className="text-sm text-gray-600 font-medium">Setup Time</div>
            </div>
          </div>

          {/* Enterprise Integration Categories */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 mb-12 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Enterprise Integration Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl text-white">📊</span>
                </div>
                <div className="font-bold text-gray-900 mb-2">CRM & Sales</div>
                <div className="text-sm text-gray-600 mb-3">Salesforce, HubSpot, Pipedrive</div>
                <div className="text-xs text-purple-600 font-semibold">120+ integrations</div>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl text-white">💼</span>
                </div>
                <div className="font-bold text-gray-900 mb-2">ERP & Finance</div>
                <div className="text-sm text-gray-600 mb-3">SAP, Oracle, QuickBooks</div>
                <div className="text-xs text-purple-600 font-semibold">85+ integrations</div>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl text-white">👥</span>
                </div>
                <div className="font-bold text-gray-900 mb-2">HR & Workforce</div>
                <div className="text-sm text-gray-600 mb-3">Workday, BambooHR, ADP</div>
                <div className="text-xs text-purple-600 font-semibold">95+ integrations</div>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl text-white">🔧</span>
                </div>
                <div className="font-bold text-gray-900 mb-2">DevOps & IT</div>
                <div className="text-sm text-gray-600 mb-3">Jira, GitHub, ServiceNow</div>
                <div className="text-xs text-purple-600 font-semibold">150+ integrations</div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Link 
              to="/marketplace"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full text-lg font-bold hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Browse All Integrations
              <ArrowRight className="ml-3 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Enterprise Pricing Section */}
      <section id="pricing-section" className="py-24 px-6 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-8">
              Enterprise-Grade
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" style={{WebkitBackgroundClip: 'text', backgroundClip: 'text'}}> Pricing</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transparent pricing that scales with your business. Start free, upgrade when you're ready.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                name: "Professional",
                price: "$49",
                period: "/user/mo",
                description: "For growing teams",
                highlight: false,
                basicFeatures: [
                  "50+ integrations",
                  "Advanced AI workflows", 
                  "Priority support",
                  "Team collaboration",
                  "Basic analytics"
                ],
                advancedFeatures: [
                  "Custom workflow builder",
                  "Advanced reporting & insights",
                  "API access with rate limits",
                  "Standard SLA (99.5% uptime)",
                  "Email support (24h response)"
                ],
                button: "Start Free Trial",
                buttonStyle: "border-2 border-purple-200 text-purple-700 hover:border-purple-300 hover:bg-purple-50"
              },
              {
                name: "Enterprise",
                price: "$149",
                period: "/user/mo",
                description: "For large organizations",
                highlight: true,
                basicFeatures: [
                  "500+ integrations",
                  "Advanced security & compliance",
                  "Dedicated success manager", 
                  "On-premise deployment",
                  "Custom workflows",
                  "24/7 priority support"
                ],
                advancedFeatures: [
                  "White-label customization",
                  "Advanced audit & compliance tools",
                  "Unlimited API calls",
                  "Premium SLA (99.9% uptime)",
                  "Phone & chat support (1h response)",
                  "Dedicated infrastructure options"
                ],
                button: "Contact Sales",
                buttonStyle: "bg-white text-purple-600 hover:bg-purple-50"
              },
              {
                name: "Custom",
                price: "Custom",
                period: "",
                description: "Tailored solutions",
                highlight: false,
                basicFeatures: [
                  "Custom integrations",
                  "White-label options",
                  "Dedicated infrastructure",
                  "Custom SLAs",
                  "Professional services"
                ],
                advancedFeatures: [
                  "Unlimited custom connectors",
                  "Multi-tenant architecture",
                  "Custom security protocols",
                  "Professional implementation",
                  "Training & certification programs",
                  "24/7 dedicated support team"
                ],
                button: "Contact Us",
                buttonStyle: "border-2 border-purple-200 text-purple-700 hover:border-purple-300 hover:bg-purple-50"
              }
            ].map((plan, i) => (
              <div key={i} className={`rounded-3xl p-8 transition-all duration-300 hover:shadow-xl relative overflow-hidden ${
                plan.highlight 
                  ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white transform scale-105' 
                  : 'bg-white border-2 border-gray-200 hover:border-purple-300'
              }`}>
                {plan.highlight && (
                  <>
                    <div className="absolute top-6 right-6 bg-white/20 text-xs font-bold px-4 py-2 rounded-full">
                      Most Popular
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  </>
                )}
                
                <div className="relative">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="text-5xl font-bold mb-2">
                      {plan.price}
                      <span className={`text-lg font-normal ${plan.highlight ? 'opacity-80' : 'text-gray-500'}`}>
                        {plan.period}
                      </span>
                    </div>
                    <p className={plan.highlight ? 'opacity-90' : 'text-gray-600'}>{plan.description}</p>
                  </div>
                  
                  <ul className="space-y-4 mb-6">
                    {plan.basicFeatures.map((feature, fi) => (
                      <li key={fi} className="flex items-center">
                        <CheckCircle className={`w-5 h-5 mr-3 flex-shrink-0 ${plan.highlight ? 'text-white' : 'text-purple-600'}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Progressive Disclosure for Advanced Features */}
                  <button 
                    onClick={() => setShowAdvancedPricing(!showAdvancedPricing)}
                    className={`text-sm font-semibold flex items-center gap-2 mb-4 transition-colors ${
                      plan.highlight ? 'text-white/80 hover:text-white' : 'text-purple-600 hover:text-purple-700'
                    }`}
                  >
                    {showAdvancedPricing ? 'Show Less Features' : 'Show All Features'}
                    {showAdvancedPricing ? 
                      <ChevronUp className="w-4 h-4" /> : 
                      <ChevronDown className="w-4 h-4" />
                    }
                  </button>
                  
                  {showAdvancedPricing && (
                    <div className={`rounded-xl p-4 mb-6 animate-fadeIn border ${
                      plan.highlight ? 'bg-white/10 border-white/20' : 'bg-purple-50 border-purple-100'
                    }`}>
                      <ul className="space-y-2">
                        {plan.advancedFeatures.map((feature, fi) => (
                          <li key={fi} className="flex items-start gap-2">
                            <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-white/80' : 'text-purple-600'}`} />
                            <span className={`text-sm ${plan.highlight ? 'text-white/90' : 'text-gray-700'}`}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <button className={`w-full py-4 px-6 rounded-xl font-bold transition-all duration-200 ${plan.buttonStyle}`}>
                    {plan.button}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Advanced Pricing Features */}
          <div className="text-center">
            <Tooltip 
              id="pricing-help"
              title="Need Help Choosing?"
              content="Not sure which plan fits your team? Our experts can recommend the perfect solution based on your needs."
              position="top"
            >
              <button 
                onClick={() => setShowAdvancedPricing(!showAdvancedPricing)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-purple-200 text-purple-700 rounded-full font-semibold hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
              >
                {showAdvancedPricing ? 'Hide' : 'Compare'} All Features
                {showAdvancedPricing ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </button>
            </Tooltip>
            
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-4">
                💡 <strong>Tip:</strong> Most customers save 40% by choosing annual billing
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Free migration support
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  14-day money back guarantee
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Volume discounts available
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-24 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 mb-8 bg-green-900/30 text-green-400 rounded-full text-sm font-bold border border-green-800">
              <Shield className="w-5 h-5 mr-2" />
              Enterprise Security
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold text-white mb-8">
              Security That Scales
              <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent" style={{WebkitBackgroundClip: 'text', backgroundClip: 'text'}}> With You</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Built from the ground up with enterprise security standards. Your data never leaves your control.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              { icon: Award, title: "SOC 2 Type II", desc: "Independently audited security controls" },
              { icon: Lock, title: "GDPR Ready", desc: "Full compliance with EU data regulations" },
              { icon: Shield, title: "End-to-End Encryption", desc: "AES-256 encryption in transit and at rest" },
              { icon: Cloud, title: "Self-Hosted Options", desc: "Deploy in your own infrastructure" }
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Data Protection",
                features: ["Zero data retention policy", "Regional data residency", "Automatic data purging", "GDPR compliance"]
              },
              {
                title: "Access Control", 
                features: ["Role-based permissions", "SSO integration (SAML/OAuth)", "Multi-factor authentication", "API key management"]
              },
              {
                title: "Monitoring",
                features: ["Complete audit trails", "Real-time threat detection", "Compliance reporting", "24/7 security monitoring"]
              }
            ].map((section, i) => (
              <div key={i} className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                <h3 className="text-xl font-bold text-white mb-6">{section.title}</h3>
                <ul className="space-y-4">
                  {section.features.map((feature, j) => (
                    <li key={j} className="flex items-center text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 text-center mb-16">
            Frequently Asked
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" style={{WebkitBackgroundClip: 'text', backgroundClip: 'text'}}> Questions</span>
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
      <footer className="py-20 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <img 
                  src="/tredy_logo_purple.png" 
                  alt="Tredy" 
                  className="h-12 object-contain mr-3"
                />
                <span className="text-white font-bold text-2xl">Tredy</span>
              </div>
              <p className="text-gray-400 text-lg mb-6 max-w-md">
                The future of intelligent workflows. Connect, visualize, and execute through AI-powered threads.
              </p>
              <div className="flex space-x-4">
                {['twitter', 'linkedin', 'github'].map((social) => (
                  <a key={social} href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-purple-400 hover:bg-gray-700 transition-colors">
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
          
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 Tredy. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-purple-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-purple-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-purple-400 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
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