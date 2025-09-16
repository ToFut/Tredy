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
  Bolt,
  Cpu,
  Sparkles,
  Menu,
  X,
  Home,
  BarChart3,
  Settings,
  Users,
  FileText,
  GitBranch,
  TrendingUp,
  Target,
  Calendar,
  Mail,
  MessageSquare,
  FolderOpen,
  Database
} from "lucide-react";

// Tool logos mapping - Real Estate Purchasing Tools
const toolLogos = {
  "Property Search": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg",
  "Financial Analysis": "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg",
  "Legal Documents": "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
  "CRM": "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg",
  "AI Analysis": "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
  "AI Engine": "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
  "Analytics": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Google_Chrome_icon_%282011%29.svg",
  "Property Matching": "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg",
  "Loan Processing": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Jira_Logo.svg",
  "Agent Coordination": "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
  "Document Generation": "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg",
  "Market Analysis": "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
};

export default function BusinessChat({ selectedIndustry = 'Real Estate' }) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [expandedDetails, setExpandedDetails] = useState({});
  const [typingMessage, setTypingMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState('chat'); // 'chat' or 'dashboard'
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const isScrollingRef = useRef(false);

  // Industry-specific data
  const industryData = {
    'Real Estate': {
      menuItems: [
        { icon: Home, label: "Dashboard", active: true },
        { icon: BarChart3, label: "Property Analytics" },
        { icon: Users, label: "Clients" },
        { icon: Calendar, label: "Property Tours" },
        { icon: Mail, label: "Marketing Campaigns" },
        { icon: MessageSquare, label: "Client Communication" },
        { icon: FolderOpen, label: "Property Documents" },
        { icon: Database, label: "Property CRM" },
        { icon: GitBranch, label: "Purchase Automation" },
        { icon: Settings, label: "Settings" }
      ],
      dashboardData: {
        title: "Real Estate Success Dashboard",
        subtitle: "Commercial Property Investment Automation",
        caseStudy: {
          company: "Metro Commercial Realty",
          location: "Downtown Financial District",
          challenge: "Manual property acquisition process taking 3-6 months",
          solution: "AI-powered property matching and automated due diligence",
          results: [
            { metric: "Deal Closure Time", before: "3-6 months", after: "2-3 weeks", improvement: "85% faster" },
            { metric: "Due Diligence Accuracy", before: "78%", after: "96%", improvement: "+18%" },
            { metric: "Cost per Transaction", before: "$45,000", after: "$12,000", improvement: "73% reduction" },
            { metric: "Deal Success Rate", before: "23%", after: "67%", improvement: "+44%" }
          ]
        },
        visualizations: [
          { type: "chart", title: "Property Acquisition Timeline", data: "Before vs After comparison" },
          { type: "map", title: "Active Property Pipeline", data: "12 properties in negotiation" },
          { type: "graph", title: "ROI Analysis", data: "Average 23% ROI improvement" }
        ],
        recentActivity: [
          { type: "deal", message: "$2.4M office building acquisition completed", time: "2 min ago", status: "closed" },
          { type: "analysis", message: "Market analysis for downtown property updated", time: "5 min ago", status: "completed" },
          { type: "financing", message: "Loan pre-approval processed for 3 properties", time: "8 min ago", status: "approved" },
          { type: "legal", message: "Purchase agreement generated for warehouse deal", time: "12 min ago", status: "ready" }
        ],
        automations: [
          { name: "Property Matching", status: "active", efficiency: "95%", value: "Saves 40 hours/week" },
          { name: "Financial Analysis", status: "active", efficiency: "100%", value: "Reduces errors by 85%" },
          { name: "Document Processing", status: "active", efficiency: "98%", value: "Processes 50 docs/hour" },
          { name: "Market Intelligence", status: "active", efficiency: "92%", value: "Real-time market data" }
        ]
      }
    },
    'Healthcare': {
      menuItems: [
        { icon: Home, label: "Dashboard", active: true },
        { icon: BarChart3, label: "Patient Analytics" },
        { icon: Users, label: "Patients" },
        { icon: Calendar, label: "Appointments" },
        { icon: Mail, label: "Patient Communications" },
        { icon: MessageSquare, label: "Telemedicine" },
        { icon: FolderOpen, label: "Medical Records" },
        { icon: Database, label: "Patient CRM" },
        { icon: GitBranch, label: "Care Automation" },
        { icon: Settings, label: "Settings" }
      ],
      dashboardData: {
        title: "Healthcare Excellence Dashboard",
        subtitle: "Multi-Specialty Clinic Automation",
        caseStudy: {
          company: "Regional Medical Center",
          location: "Austin, Texas",
          challenge: "Patient wait times averaging 2.5 hours, 30% no-show rate",
          solution: "AI-powered patient flow optimization and predictive scheduling",
          results: [
            { metric: "Average Wait Time", before: "2.5 hours", after: "18 minutes", improvement: "88% reduction" },
            { metric: "No-Show Rate", before: "30%", after: "8%", improvement: "73% reduction" },
            { metric: "Patient Satisfaction", before: "6.2/10", after: "9.1/10", improvement: "+47%" },
            { metric: "Daily Patient Capacity", before: "45 patients", after: "78 patients", improvement: "+73%" }
          ]
        },
        visualizations: [
          { type: "chart", title: "Patient Flow Optimization", data: "Real-time wait time tracking" },
          { type: "graph", title: "Appointment Success Rate", data: "92% on-time completion" },
          { type: "heatmap", title: "Peak Hours Analysis", data: "Optimized scheduling patterns" }
        ],
        recentActivity: [
          { type: "patient", message: "High-risk patient flagged for immediate follow-up", time: "2 min ago", status: "urgent" },
          { type: "appointment", message: "Telemedicine consultation completed successfully", time: "5 min ago", status: "completed" },
          { type: "records", message: "Lab results automatically integrated into patient chart", time: "8 min ago", status: "synced" },
          { type: "care", message: "Post-surgery care plan generated for patient", time: "12 min ago", status: "active" }
        ],
        automations: [
          { name: "Patient Flow", status: "active", efficiency: "98%", value: "Reduces wait time by 88%" },
          { name: "Predictive Scheduling", status: "active", efficiency: "96%", value: "Prevents 73% no-shows" },
          { name: "Clinical Decision Support", status: "active", efficiency: "100%", value: "Improves diagnosis accuracy" },
          { name: "Care Coordination", status: "active", efficiency: "94%", value: "Seamless provider communication" }
        ]
      }
    },
    'E-commerce': {
      menuItems: [
        { icon: Home, label: "Dashboard", active: true },
        { icon: BarChart3, label: "Sales Analytics" },
        { icon: Users, label: "Customers" },
        { icon: Calendar, label: "Campaigns" },
        { icon: Mail, label: "Email Marketing" },
        { icon: MessageSquare, label: "Customer Support" },
        { icon: FolderOpen, label: "Product Catalog" },
        { icon: Database, label: "Order Management" },
        { icon: GitBranch, label: "Sales Automation" },
        { icon: Settings, label: "Settings" }
      ],
      dashboardData: {
        title: "E-commerce Growth Dashboard",
        subtitle: "Fashion Retail Automation Success",
        caseStudy: {
          company: "StyleHub Fashion",
          location: "Los Angeles, California",
          challenge: "Manual order processing causing 24-hour delays, 15% cart abandonment",
          solution: "AI-powered inventory optimization and personalized customer experience",
          results: [
            { metric: "Order Processing Time", before: "24 hours", after: "2.3 minutes", improvement: "99% faster" },
            { metric: "Cart Abandonment Rate", before: "15%", after: "4.2%", improvement: "72% reduction" },
            { metric: "Customer Lifetime Value", before: "$127", after: "$389", improvement: "+206%" },
            { metric: "Inventory Turnover", before: "3.2x/year", after: "8.7x/year", improvement: "+172%" }
          ]
        },
        visualizations: [
          { type: "chart", title: "Sales Performance Trends", data: "Real-time revenue tracking" },
          { type: "funnel", title: "Conversion Funnel Analysis", data: "Cart abandonment optimization" },
          { type: "map", title: "Global Sales Distribution", data: "Multi-region performance" }
        ],
        recentActivity: [
          { type: "order", message: "VIP customer order processed with priority shipping", time: "2 min ago", status: "shipped" },
          { type: "inventory", message: "Low stock alert triggered for best-selling items", time: "5 min ago", status: "reordered" },
          { type: "customer", message: "Personalized product recommendations sent", time: "8 min ago", status: "delivered" },
          { type: "marketing", message: "Dynamic pricing updated for seasonal items", time: "12 min ago", status: "optimized" }
        ],
        automations: [
          { name: "Smart Inventory", status: "active", efficiency: "99%", value: "Prevents stockouts by 95%" },
          { name: "Personalization Engine", status: "active", efficiency: "97%", value: "Increases conversion by 67%" },
          { name: "Dynamic Pricing", status: "active", efficiency: "92%", value: "Maximizes profit margins" },
          { name: "Customer Journey", status: "active", efficiency: "95%", value: "Reduces churn by 58%" }
        ]
      }
    },
    'Finance': {
      menuItems: [
        { icon: Home, label: "Dashboard", active: true },
        { icon: BarChart3, label: "Financial Analytics" },
        { icon: Users, label: "Clients" },
        { icon: Calendar, label: "Investment Meetings" },
        { icon: Mail, label: "Client Communications" },
        { icon: MessageSquare, label: "Financial Advisory" },
        { icon: FolderOpen, label: "Financial Reports" },
        { icon: Database, label: "Portfolio Management" },
        { icon: GitBranch, label: "Risk Automation" },
        { icon: Settings, label: "Settings" }
      ],
      dashboardData: {
        title: "Financial Services Excellence Dashboard",
        subtitle: "Wealth Management Automation",
        caseStudy: {
          company: "Premier Wealth Advisors",
          location: "New York, New York",
          challenge: "Manual portfolio rebalancing taking 2-3 days, compliance reporting delays",
          solution: "AI-powered portfolio optimization and real-time risk monitoring",
          results: [
            { metric: "Portfolio Rebalancing", before: "2-3 days", after: "15 minutes", improvement: "99% faster" },
            { metric: "Risk Analysis Accuracy", before: "78%", after: "96%", improvement: "+18%" },
            { metric: "Client AUM Growth", before: "$2.1B", after: "$4.7B", improvement: "+124%" },
            { metric: "Compliance Score", before: "87%", after: "99.8%", improvement: "+15%" }
          ]
        },
        visualizations: [
          { type: "chart", title: "Portfolio Performance Analytics", data: "Real-time asset allocation" },
          { type: "graph", title: "Risk-Return Optimization", data: "Dynamic risk modeling" },
          { type: "dashboard", title: "Client Satisfaction Metrics", data: "NPS score tracking" }
        ],
        recentActivity: [
          { type: "portfolio", message: "$50M portfolio rebalanced for optimal risk-return", time: "2 min ago", status: "optimized" },
          { type: "risk", message: "Market volatility alert triggered for tech stocks", time: "5 min ago", status: "monitoring" },
          { type: "compliance", message: "SEC filing completed automatically", time: "8 min ago", status: "submitted" },
          { type: "client", message: "High-net-worth client onboarding completed", time: "12 min ago", status: "active" }
        ],
        automations: [
          { name: "Portfolio Optimization", status: "active", efficiency: "98%", value: "Increases returns by 23%" },
          { name: "Risk Management", status: "active", efficiency: "96%", value: "Reduces volatility by 34%" },
          { name: "Compliance Automation", status: "active", efficiency: "100%", value: "Zero regulatory violations" },
          { name: "Client Intelligence", status: "active", efficiency: "94%", value: "Personalized investment strategies" }
        ]
      }
    },
    'Manufacturing': {
      menuItems: [
        { icon: Home, label: "Dashboard", active: true },
        { icon: BarChart3, label: "Production Analytics" },
        { icon: Users, label: "Workforce" },
        { icon: Calendar, label: "Production Schedule" },
        { icon: Mail, label: "Supplier Communications" },
        { icon: MessageSquare, label: "Quality Control" },
        { icon: FolderOpen, label: "Production Reports" },
        { icon: Database, label: "Inventory Management" },
        { icon: GitBranch, label: "Production Automation" },
        { icon: Settings, label: "Settings" }
      ],
      dashboardData: {
        title: "Manufacturing Excellence Dashboard",
        subtitle: "Smart Factory Automation",
        caseStudy: {
          company: "Precision Manufacturing Corp",
          location: "Detroit, Michigan",
          challenge: "Production downtime 15%, quality defects 8%, manual scheduling inefficiencies",
          solution: "IoT-enabled predictive maintenance and AI-powered production optimization",
          results: [
            { metric: "Production Efficiency", before: "67%", after: "94%", improvement: "+40%" },
            { metric: "Quality Defect Rate", before: "8%", after: "0.8%", improvement: "90% reduction" },
            { metric: "Unplanned Downtime", before: "15%", after: "3%", improvement: "80% reduction" },
            { metric: "Energy Consumption", before: "100%", after: "73%", improvement: "27% reduction" }
          ]
        },
        visualizations: [
          { type: "chart", title: "Production Line Performance", data: "Real-time efficiency tracking" },
          { type: "graph", title: "Quality Control Metrics", data: "Defect rate monitoring" },
          { type: "dashboard", title: "Predictive Maintenance Alerts", data: "Equipment health status" }
        ],
        recentActivity: [
          { type: "production", message: "Line 3 optimized for 15% efficiency gain", time: "2 min ago", status: "optimized" },
          { type: "quality", message: "Zero defects achieved for 48-hour production run", time: "5 min ago", status: "perfect" },
          { type: "maintenance", message: "Predictive maintenance prevented $50K equipment failure", time: "8 min ago", status: "prevented" },
          { type: "supply", message: "Smart inventory triggered automatic supplier reorder", time: "12 min ago", status: "ordered" }
        ],
        automations: [
          { name: "Smart Production", status: "active", efficiency: "97%", value: "Increases output by 40%" },
          { name: "Quality Intelligence", status: "active", efficiency: "99%", value: "Reduces defects by 90%" },
          { name: "Predictive Maintenance", status: "active", efficiency: "95%", value: "Prevents 80% downtime" },
          { name: "Supply Chain", status: "active", efficiency: "92%", value: "Optimizes inventory costs" }
        ]
      }
    },
    'Education': {
      menuItems: [
        { icon: Home, label: "Dashboard", active: true },
        { icon: BarChart3, label: "Learning Analytics" },
        { icon: Users, label: "Students" },
        { icon: Calendar, label: "Class Schedule" },
        { icon: Mail, label: "Student Communications" },
        { icon: MessageSquare, label: "Online Learning" },
        { icon: FolderOpen, label: "Course Materials" },
        { icon: Database, label: "Student Records" },
        { icon: GitBranch, label: "Learning Automation" },
        { icon: Settings, label: "Settings" }
      ],
      dashboardData: {
        title: "Education Excellence Dashboard",
        subtitle: "University Learning Management Automation",
        caseStudy: {
          company: "Metropolitan State University",
          location: "Chicago, Illinois",
          challenge: "Student dropout rate 23%, manual grading taking 2-3 weeks, low engagement",
          solution: "AI-powered personalized learning paths and automated assessment system",
          results: [
            { metric: "Student Retention", before: "77%", after: "94%", improvement: "+22%" },
            { metric: "Grading Speed", before: "2-3 weeks", after: "24 hours", improvement: "95% faster" },
            { metric: "Course Completion", before: "68%", after: "89%", improvement: "+31%" },
            { metric: "Student Satisfaction", before: "6.8/10", after: "9.2/10", improvement: "+35%" }
          ]
        },
        visualizations: [
          { type: "chart", title: "Student Performance Analytics", data: "Real-time learning progress" },
          { type: "graph", title: "Course Engagement Metrics", data: "Interactive learning tracking" },
          { type: "dashboard", title: "Predictive Dropout Prevention", data: "Early intervention alerts" }
        ],
        recentActivity: [
          { type: "enrollment", message: "AI-matched 47 students to optimal course paths", time: "2 min ago", status: "optimized" },
          { type: "learning", message: "Personalized study plan generated for struggling student", time: "5 min ago", status: "created" },
          { type: "assessment", message: "Automated grading completed for 156 assignments", time: "8 min ago", status: "graded" },
          { type: "engagement", message: "Interactive learning module increased participation by 67%", time: "12 min ago", status: "active" }
        ],
        automations: [
          { name: "Personalized Learning", status: "active", efficiency: "98%", value: "Increases retention by 22%" },
          { name: "Smart Assessment", status: "active", efficiency: "96%", value: "Grades 95% faster" },
          { name: "Engagement Analytics", status: "active", efficiency: "94%", value: "Boosts completion by 31%" },
          { name: "Predictive Support", status: "active", efficiency: "99%", value: "Prevents 78% dropouts" }
        ]
      }
    }
  };

  // Get current industry data with error handling
  const currentIndustryData = industryData[selectedIndustry] || industryData['Real Estate'];
  const menuItems = currentIndustryData?.menuItems || [];
  const dashboardData = currentIndustryData?.dashboardData || {};

  // Industry-specific chat messages
  const industryChatMessages = {
    'Real Estate': [
      {
        type: "assistant",
        status: "complete",
        message: "Hi! I'm Tredy, your real estate automation assistant. I can help you automate your property purchasing workflow. What type of property are you looking to purchase?",
        timestamp: "9:31 AM"
      },
      {
        type: "user",
        message: "I'm looking to buy a commercial property for my business expansion. Can you help me automate the entire purchasing process?",
        timestamp: "9:32 AM"
      },
      {
        type: "assistant",
        status: "processing",
        message: "Commercial property purchase detected! 🏢 Setting up automated purchasing workflow...",
        tools: ["Property Search", "Financial Analysis", "Legal Documents", "CRM"],
        metrics: { time: "1.8s", confidence: 94, model: "GPT-4", tokens: 189 },
        thinking: [
          "Analyzing commercial property requirements",
          "Setting up automated property search criteria",
          "Preparing financial analysis tools",
          "Configuring legal document automation"
        ],
        timestamp: "9:32 AM"
      }
    ],
    'Healthcare': [
      {
        type: "assistant",
        status: "complete",
        message: "Hi! I'm Tredy, your healthcare automation assistant. I can help you automate patient care workflows and streamline your medical practice. What type of healthcare automation do you need?",
        timestamp: "9:31 AM"
      },
      {
        type: "user",
        message: "I need to automate patient intake, appointment scheduling, and medical record management for my clinic. Can you help?",
        timestamp: "9:32 AM"
      },
      {
        type: "assistant",
        status: "processing",
        message: "Healthcare clinic automation detected! 🏥 Setting up patient care workflow...",
        tools: ["Patient Intake", "Appointment Scheduling", "Medical Records", "CRM"],
        metrics: { time: "2.1s", confidence: 96, model: "GPT-4", tokens: 201 },
        thinking: [
          "Analyzing clinic workflow requirements",
          "Setting up automated patient intake system",
          "Preparing appointment scheduling tools",
          "Configuring medical record automation"
        ],
        timestamp: "9:32 AM"
      }
    ],
    'E-commerce': [
      {
        type: "assistant",
        status: "complete",
        message: "Hi! I'm Tredy, your e-commerce automation assistant. I can help you automate order processing, inventory management, and customer support. What e-commerce automation do you need?",
        timestamp: "9:31 AM"
      },
      {
        type: "user",
        message: "I need to automate order processing, inventory management, and customer support for my online store. Can you set this up?",
        timestamp: "9:32 AM"
      },
      {
        type: "assistant",
        status: "processing",
        message: "E-commerce automation detected! 🛒 Setting up sales workflow...",
        tools: ["Order Processing", "Inventory Management", "Customer Support", "CRM"],
        metrics: { time: "1.9s", confidence: 95, model: "GPT-4", tokens: 187 },
        thinking: [
          "Analyzing e-commerce workflow requirements",
          "Setting up automated order processing",
          "Preparing inventory management tools",
          "Configuring customer support automation"
        ],
        timestamp: "9:32 AM"
      }
    ],
    'Finance': [
      {
        type: "assistant",
        status: "complete",
        message: "Hi! I'm Tredy, your financial services automation assistant. I can help you automate portfolio management, risk analysis, and compliance reporting. What financial automation do you need?",
        timestamp: "9:31 AM"
      },
      {
        type: "user",
        message: "I need to automate portfolio management, risk analysis, and compliance reporting for my financial advisory firm. Can you help?",
        timestamp: "9:32 AM"
      },
      {
        type: "assistant",
        status: "processing",
        message: "Financial services automation detected! 💰 Setting up portfolio workflow...",
        tools: ["Portfolio Management", "Risk Analysis", "Compliance Monitoring", "CRM"],
        metrics: { time: "2.2s", confidence: 97, model: "GPT-4", tokens: 203 },
        thinking: [
          "Analyzing financial workflow requirements",
          "Setting up automated portfolio management",
          "Preparing risk analysis tools",
          "Configuring compliance monitoring"
        ],
        timestamp: "9:32 AM"
      }
    ],
    'Manufacturing': [
      {
        type: "assistant",
        status: "complete",
        message: "Hi! I'm Tredy, your manufacturing automation assistant. I can help you automate production scheduling, quality control, and supply chain management. What manufacturing automation do you need?",
        timestamp: "9:31 AM"
      },
      {
        type: "user",
        message: "I need to automate production scheduling, quality control, and supply chain management for my manufacturing plant. Can you set this up?",
        timestamp: "9:32 AM"
      },
      {
        type: "assistant",
        status: "processing",
        message: "Manufacturing automation detected! 🏭 Setting up production workflow...",
        tools: ["Production Scheduling", "Quality Control", "Inventory Management", "CRM"],
        metrics: { time: "2.0s", confidence: 96, model: "GPT-4", tokens: 195 },
        thinking: [
          "Analyzing manufacturing workflow requirements",
          "Setting up automated production scheduling",
          "Preparing quality control tools",
          "Configuring supply chain automation"
        ],
        timestamp: "9:32 AM"
      }
    ],
    'Education': [
      {
        type: "assistant",
        status: "complete",
        message: "Hi! I'm Tredy, your education automation assistant. I can help you automate student management, course scheduling, and learning analytics. What education automation do you need?",
        timestamp: "9:31 AM"
      },
      {
        type: "user",
        message: "I need to automate student enrollment, course scheduling, and learning analytics for my educational institution. Can you help?",
        timestamp: "9:32 AM"
      },
      {
        type: "assistant",
        status: "processing",
        message: "Education automation detected! 🎓 Setting up learning workflow...",
        tools: ["Student Management", "Course Scheduling", "Learning Analytics", "CRM"],
        metrics: { time: "1.7s", confidence: 94, model: "GPT-4", tokens: 181 },
        thinking: [
          "Analyzing education workflow requirements",
          "Setting up automated student management",
          "Preparing course scheduling tools",
          "Configuring learning analytics"
        ],
        timestamp: "9:32 AM"
      }
    ]
  };

  // Get current industry chat messages
  const chatMessages = industryChatMessages[selectedIndustry] || industryChatMessages['Real Estate'];

  // Reset chat animation when industry changes
  useEffect(() => {
    setCurrentMessageIndex(0);
    setTypingMessage("");
    setExpandedDetails({});
    setIsTyping(false);
    // Clear any pending timeouts to prevent memory leaks
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  }, [selectedIndustry]);

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
          behavior: 'smooth'
        });
        
        // Reset scrolling flag after animation completes
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 500);
      }
    }, delay);
  }, []);

  // Auto-scroll to bottom when new message appears
  useEffect(() => {
    smoothScrollToBottom(150);
  }, [currentMessageIndex, smoothScrollToBottom]);

  // Typing animation effect with smooth scrolling
  useEffect(() => {
    let typingInterval = null;
    let timeoutId = null;
    
    if (currentMessageIndex < chatMessages.length) {
      const currentMsg = chatMessages[currentMessageIndex];
      
      if (currentMsg.type === "assistant" && typeof currentMsg.message === "string") {
        setIsTyping(true);
        let charIndex = 0;
        const message = currentMsg.message;
        
        typingInterval = setInterval(() => {
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
            
            timeoutId = setTimeout(() => {
              if (currentMessageIndex < chatMessages.length - 1) {
                setCurrentMessageIndex(currentMessageIndex + 1);
                setTypingMessage("");
              }
            }, 2500);
          }
        }, 35); // Slightly faster typing for smoother feel
      } else {
        // For non-typing messages, show immediately and scroll
        smoothScrollToBottom(200);
        
        timeoutId = setTimeout(() => {
          if (currentMessageIndex < chatMessages.length - 1) {
            setCurrentMessageIndex(currentMessageIndex + 1);
          }
        }, currentMsg.type === "assistant" ? 2800 : 1200);
      }
    } else {
      // Reset animation with smooth scroll to top
      timeoutId = setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
        
        timeoutId = setTimeout(() => {
          setCurrentMessageIndex(0);
          setTypingMessage("");
          setExpandedDetails({});
          setIsTyping(false);
        }, 1200);
      }, 5500);
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (typingInterval) clearInterval(typingInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentMessageIndex, smoothScrollToBottom, chatMessages.length]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear all timeouts and intervals when component unmounts
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

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
              <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-purple-100">
                <span className="text-sm">{item.icon}</span>
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
                <span className="text-xs text-green-600 font-medium">{item.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {content.quickStats && (
          <div className="grid grid-cols-2 gap-2">
            {content.quickStats.map((stat, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-lg p-2 border border-purple-100">
                <span className="text-xs text-gray-600">{stat.label}</span>
                <span className="text-xs font-medium text-purple-700">{stat.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Automation Features */}
        {content.automation && (
          <div className="grid grid-cols-2 gap-2">
            {content.automation.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-purple-100">
                <span className="text-sm">{feature.icon}</span>
                <span className="text-xs font-medium text-gray-700">{feature.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Status */}
        {content.status && (
          <div className="grid grid-cols-2 gap-2">
            {content.status.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-lg p-2 border border-purple-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{item.label}</span>
                </div>
                <span className="text-xs font-medium text-green-600">{item.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* Performance */}
        {content.performance && (
          <div className="space-y-1">
            {content.performance.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-lg p-2 border border-purple-100">
                <span className="text-xs text-gray-600">{item.label}</span>
                <span className="text-xs font-medium text-purple-700">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Monitoring */}
        {content.monitoring && (
          <div className="grid grid-cols-2 gap-2">
            {content.monitoring.map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-purple-100">
                <span className="text-sm">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-700">{item.label}</div>
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
              <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-purple-100">
                <span className="text-sm">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-700">{item.label}</div>
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

  // Error boundary for the component
  if (error) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border-2 border-red-200 h-[600px] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Business Chat Error</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 h-[600px] flex flex-col lg:flex-row">

      {/* Left Sidebar Menu - Hidden on mobile */}
      <div className={`bg-gradient-to-b from-purple-600 to-purple-700 transition-all duration-300 ${isMenuCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 hidden lg:block`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            {!isMenuCollapsed && (
              <div className="flex items-center space-x-3">
                <Bot className="w-8 h-8 text-white" />
                <div>
                  <span className="text-white font-bold text-lg">Tredy</span>
                  <div className="text-xs text-purple-200">AI Platform</div>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              {isMenuCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
          </div>
          
          <nav className="space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  item.active 
                    ? 'bg-white/20 text-white' 
                    : 'text-purple-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isMenuCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Center Dashboard */}
      <div className={`flex-1 flex flex-col ${mobileView === 'dashboard' ? 'block' : 'hidden lg:flex'}`}>
        {/* Dashboard Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 border-b border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-bold text-xl">{dashboardData.title}</h1>
              <p className="text-purple-100 text-sm">{dashboardData.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile View Toggle */}
              <div className="lg:hidden flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/30">
                <button
                  onClick={() => setMobileView('dashboard')}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                    mobileView === 'dashboard' ? 'bg-white text-purple-600' : 'text-white'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setMobileView('chat')}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                    mobileView === 'chat' ? 'bg-white text-purple-600' : 'text-white'
                  }`}
                >
                  Chat
                </button>
              </div>
              <div className="hidden lg:flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/30">
                <Activity className="w-4 h-4 text-white animate-pulse" />
                <span className="text-xs text-white font-semibold">Live Demo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 p-3 lg:p-6 bg-gradient-to-br from-purple-50/30 to-white overflow-y-auto">
          {/* Case Study Header */}
          {dashboardData.caseStudy && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{dashboardData.caseStudy.company}</h3>
                  <p className="text-sm text-gray-600 mb-1">{dashboardData.caseStudy.location}</p>
                  <p className="text-sm text-gray-700 font-medium">{dashboardData.caseStudy.challenge}</p>
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                  Success Story
                </div>
              </div>
              
              {/* Results Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboardData.caseStudy.results.map((result, index) => (
                  <div key={index} className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <div className="text-xs text-gray-600 mb-1">{result.metric}</div>
                    <div className="text-sm font-bold text-purple-700 mb-1">{result.improvement}</div>
                    <div className="text-xs text-gray-500">
                      <span className="line-through">{result.before}</span> → <span className="font-medium">{result.after}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visualizations */}
          {dashboardData.visualizations && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {dashboardData.visualizations.map((viz, index) => (
                <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <h4 className="font-semibold text-gray-800 text-sm">{viz.title}</h4>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-600">{viz.data}</div>
                    <div className="text-xs text-purple-600 font-medium mt-1">{viz.type}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                Live Activity
              </h3>
              <div className="space-y-3">
                {dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-purple-50 transition-colors">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    <span className="text-xs text-green-600 font-medium">{activity.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Automations */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-purple-600" />
                Automation Impact
              </h3>
              <div className="space-y-3">
                {dashboardData.automations.map((automation, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-purple-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="text-sm text-gray-700 font-medium">{automation.name}</div>
                        <div className="text-xs text-gray-500">{automation.value}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-600 font-medium">{automation.efficiency}</div>
                      <div className="text-xs text-gray-500">{automation.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side Chat */}
      <div className={`w-full lg:w-80 flex-shrink-0 border-l border-purple-200 flex flex-col ${mobileView === 'chat' ? 'block' : 'hidden lg:flex'}`}>
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 border-b border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-6 h-6 text-white" />
              <span className="text-white font-bold">Tredy AI</span>
            </div>
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 border border-white/30">
              <Sparkles className="w-3 h-3 text-white animate-spin" />
              <span className="text-xs text-white font-semibold">Active</span>
            </div>
          </div>
        </div>
      
        {/* Chat Messages */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-purple-50/30 via-white to-purple-50/20 scroll-smooth"
          style={{ 
            scrollBehavior: 'smooth',
            scrollPaddingBottom: '20px'
          }}
        >
          {chatMessages.slice(0, currentMessageIndex + 1).map((msg, idx) => (
            <div 
              key={idx} 
              className={`${msg.type === 'user' ? 'flex justify-end' : 'flex justify-start'} animate-messageSlide`}
              style={{ animationDelay: `${idx * 0.2}s` }}
            >
              <div className={`max-w-[85%] sm:max-w-[90%] ${msg.type === 'user' ? 'order-2' : ''}`}>
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

                    {/* Compact Tool Logos with Metrics - Single Line */}
                    {msg.tools && idx <= currentMessageIndex && (
                      <div className="flex items-center gap-3 text-xs text-gray-600 px-3 mt-3 bg-purple-50/50 rounded-lg py-2 border border-purple-100 overflow-x-auto">
                        {/* Compact Tool Logos */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {msg.tools.map((tool, ti) => (
                            <div key={ti} className="relative group flex-shrink-0">
                              <div className="w-5 h-5 bg-white rounded-full border border-purple-200 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110">
                                {toolLogos[tool] ? (
                                  <img 
                                    src={toolLogos[tool]} 
                                    alt={tool}
                                    className="w-3 h-3 rounded-full object-cover"
                                    title={tool}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      const fallback = e.target.nextElementSibling;
                                      if (fallback) {
                                        fallback.style.display = 'flex';
                                      }
                                    }}
                                    onLoad={(e) => {
                                      const fallback = e.target.nextElementSibling;
                                      if (fallback) {
                                        fallback.style.display = 'none';
                                      }
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className={`w-3 h-3 rounded-full flex items-center justify-center text-xs font-bold ${toolLogos[tool] ? 'hidden' : 'flex'}`}
                                  style={{ 
                                    backgroundColor: tool === 'AI Analysis' || tool === 'AI Engine' ? '#10b981' : 
                                                   tool === 'Analytics' ? '#3b82f6' : 
                                                   tool === 'CRM' ? '#f59e0b' : '#8b5cf6',
                                    color: 'white'
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
                          <Bolt className="w-3 h-3 text-purple-600" />
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
                          <span className="font-bold text-purple-700 text-xs">{msg.metrics.confidence}%</span>
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
                              onClick={() => setExpandedDetails({ ...expandedDetails, [idx]: !expandedDetails[idx] })}
                              className="flex items-center gap-1 text-purple-600 hover:text-purple-800 transition-colors duration-200 font-medium flex-shrink-0"
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
        <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 border-t border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Type @tredy to start..." 
                className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 bg-white/80 backdrop-blur-sm transition-all duration-300 text-xs font-medium placeholder-gray-500"
                disabled
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Sparkles className="w-3 h-3 text-purple-600 animate-pulse" />
              </div>
            </div>
            <button className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 hover:shadow-lg transition-all duration-300">
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 text-center">
            <p className="text-xs text-purple-600 font-medium">
              ✨ Live AI demo
            </p>
          </div>
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