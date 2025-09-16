import React, { useState, useEffect } from "react";
import { Sparkle, Plus, EnvelopeSimple, Calendar, Play, FlowArrow, Globe, ArrowRight } from "@phosphor-icons/react";
import useUser from "@/hooks/useUser";
import Workspace from "@/models/workspace";
import WorkspaceChat from "@/components/WorkspaceChat";
import { FullScreenLoader } from "@/components/Preloader";
import NewWorkspaceModal, { useNewWorkspaceModal } from "@/components/Modals/NewWorkspace";
import AgentFlows from "@/models/agentFlows";
import { useTranslation } from "react-i18next";
import { useLanguageOptions } from "@/hooks/useLanguageOptions";
import ChatDemo from "../LandingPage/ChatDemo";
import AIEnterprisePlatform from "@/components/AIEnterprisePlatform";
import ProfessionalDemo from "@/components/ProfessionalDemo";

// Demo chat messages for homepage
const DEMO_CHAT_MESSAGES = [
  {
    id: 1,
    role: "user",
    content: "Hi! I'm interested in getting a quote for a kitchen remodel. Can you help me?",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    uuid: "demo-user-1"
  },
  {
    id: 2,
    role: "assistant",
    content: "Hello! I'd be happy to help you with your kitchen remodel quote. Let me gather some information about your project and check our current availability.",
    timestamp: new Date(Date.now() - 1000 * 60 * 4), // 4 minutes ago
    uuid: "demo-assistant-1"
  },
  {
    id: 3,
    role: "assistant",
    content: "🏗️ **Kitchen Remodel Analysis Complete**\n\n**Based on your location and typical kitchen remodels:**\n• Estimated timeline: 4-6 weeks\n• Material cost range: $15,000-$25,000\n• Labor estimate: $8,000-$12,000\n• Next available start: March 15th\n\n**Popular upgrades in your area:**\n• Quartz countertops (+$3,000)\n• Custom cabinets (+$5,000)\n• Smart appliances (+$2,000)\n\nWould you like me to schedule a free consultation with our project manager?",
    timestamp: new Date(Date.now() - 1000 * 60 * 3), // 3 minutes ago
    uuid: "demo-assistant-2"
  },
  {
    id: 4,
    role: "user",
    content: "Yes, that sounds great! Can you also send me some photos of recent kitchen projects?",
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
    uuid: "demo-user-2"
  },
  {
    id: 5,
    role: "assistant",
    content: "✅ **Consultation Scheduled & Portfolio Sent**\n\n**Your Consultation:**\n• Date: March 8th at 2:00 PM\n• Location: Your home (free in-home visit)\n• Duration: 1 hour\n• Project Manager: Mike Rodriguez\n\n**Portfolio Gallery:**\n• 12 recent kitchen remodels sent to your email\n• Before/after photos included\n• Material samples will be brought to consultation\n\n**Next Steps:**\n• Calendar invite sent to your email\n• Project questionnaire sent for pre-consultation\n• Material catalog will be emailed tomorrow\n\nI've also added you to our project tracking system - you'll get weekly updates automatically!",
    timestamp: new Date(Date.now() - 1000 * 60 * 1), // 1 minute ago
    uuid: "demo-assistant-3"
  }
];


export default function Home() {
  const { user } = useUser();
  const { t } = useTranslation();
  const { currentLanguage, supportedLanguages, getLanguageName, changeLanguage } = useLanguageOptions();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flows, setFlows] = useState([]);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const { showing: showingNewWorkspace, showModal, hideModal } = useNewWorkspaceModal();

  useEffect(() => {
    async function getDefaultWorkspace() {
      try {
        setLoading(true);
        
        // Get all workspaces
        const allWorkspaces = await Workspace.all();
        
        // Try to find a home workspace or use the first available
        let defaultWorkspace = allWorkspaces?.find(ws => ws.slug === 'home');
        
        if (!defaultWorkspace && allWorkspaces?.length > 0) {
          // Use the first available workspace
          defaultWorkspace = allWorkspaces[0];
        }
        
        if (!defaultWorkspace) {
          // If no workspaces exist, we'll show a welcome screen
          // The workspace creation should be handled by the onboarding flow
          console.log('No workspaces available');
        }
        
        setWorkspace(defaultWorkspace);
      } catch (error) {
        console.error('Error loading workspace:', error);
        // Even on error, set loading to false to show UI
      } finally {
        setLoading(false);
      }
    }

    getDefaultWorkspace();
  }, []);
  
  // Load available flows
  useEffect(() => {
    async function loadFlows() {
      try {
        const { success, flows: flowList } = await AgentFlows.listFlows();
        if (success && flowList) {
          setFlows(flowList.slice(0, 4)); // Show max 4 flows
        }
      } catch (error) {
        console.error('Error loading flows:', error);
      }
    }
    
    if (workspace) {
      loadFlows();
    }
  }, [workspace]);


  if (loading) {
    return <FullScreenLoader />;
  }

  return (
    <div className="h-full max-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/10">
      {/* Language Selector - Minimal top bar */}
      <div className="absolute top-4 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 rounded-xl border border-gray-200/60 dark:border-gray-700/60 transition-all shadow-sm"
          >
            <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{getLanguageName(currentLanguage)}</span>
          </button>
          {showLangDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 backdrop-blur-sm">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    changeLanguage(lang);
                    setShowLangDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    lang === currentLanguage ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300'
                  } ${lang === supportedLanguages[0] ? 'rounded-t-xl' : ''} ${
                    lang === supportedLanguages[supportedLanguages.length - 1] ? 'rounded-b-xl' : ''
                  }`}
                >
                  {getLanguageName(lang)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {workspace ? (
          <div className="flex flex-col h-full min-h-0">
            {/* Hero Section */}
            <div className="relative px-4 py-12 sm:py-16 lg:py-20">
              <div className="max-w-4xl mx-auto text-center">
                {/* Hero Content */}
                <div className="mb-8">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                    Achieve More with
                    <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Intelligent AI
                    </span>
                  </h1>
                  <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
                    Turn your ideas into action. Let AI handle your workflows, emails, scheduling, and automation.
                  </p>
                  
                  {/* CTA Section */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      onClick={() => {
                        const chatInput = document.querySelector('textarea[placeholder*="Send a message"]');
                        if (chatInput) {
                          chatInput.focus();
                        }
                      }}
                      className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                    >
                      <span>Start Creating</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Just type <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-blue-600 dark:text-blue-400">@agent</code> to begin
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="px-4 pb-8">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
                  What can your AI assistant do?
                </h2>
                
                {/* Flow Automation Section */}
                <div className="mb-16">
                  <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-8 flex items-center justify-center gap-3">
                    <FlowArrow className="w-6 h-6 text-purple-600" />
                    Automated Task Flows
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Create Tasks & Automate */}
                    <button
                      onClick={() => {
                        const chatInput = document.querySelector('textarea[placeholder*="Send a message"]');
                        if (chatInput) {
                          chatInput.value = '@flow create tasks then automate';
                          chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                          chatInput.focus();
                        }
                      }}
                      className="group bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 hover:from-purple-100 hover:to-violet-100 dark:hover:from-purple-900/30 dark:hover:to-violet-900/30 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plus className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm">Create & Automate</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">New tasks</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-left">
                        Create multiple tasks and automatically execute them in sequence
                      </p>
                    </button>

                    {/* Automate Existing Tasks */}
                    <button
                      onClick={() => {
                        const chatInput = document.querySelector('textarea[placeholder*="Send a message"]');
                        if (chatInput) {
                          chatInput.value = '@flow automate existing tasks';
                          chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                          chatInput.focus();
                        }
                      }}
                      className="group bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm">Automate Existing</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Current tasks</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-left">
                        Take existing tasks and create automation workflow
                      </p>
                    </button>

                    {/* Customer Onboarding */}
                    <button
                      onClick={() => {
                        const chatInput = document.querySelector('textarea[placeholder*="Send a message"]');
                        if (chatInput) {
                          chatInput.value = '@flow customer onboarding automation';
                          chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                          chatInput.focus();
                        }
                      }}
                      className="group bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 rounded-2xl p-6 border border-green-200/50 dark:border-green-700/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm">Customer Onboarding</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Complex workflow</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-left">
                        Automated customer onboarding with task creation and execution
                      </p>
                    </button>

                    {/* Dynamic Task Creation */}
                    <button
                      onClick={() => {
                        const chatInput = document.querySelector('textarea[placeholder*="Send a message"]');
                        if (chatInput) {
                          chatInput.value = '@flow dynamic task creation';
                          chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                          chatInput.focus();
                        }
                      }}
                      className="group bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 hover:from-orange-100 hover:to-red-100 dark:hover:from-orange-900/30 dark:hover:to-red-900/30 rounded-2xl p-6 border border-orange-200/50 dark:border-orange-700/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm">Dynamic Creation</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Smart automation</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-left">
                        Create tasks dynamically based on conditions and data
                      </p>
                    </button>
                  </div>
                  
                  {/* Live Chat Demo */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/50">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Sparkle className="w-5 h-5 text-purple-600" />
                      See Tredy in Action
                    </h4>
                    
                    {/* Chat Demo Component */}
                    <ChatDemo />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                  {/* Smart Email Management */}
                  <div className="group">
                    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl flex items-center justify-center mb-6">
                        <EnvelopeSimple className="w-8 h-8 text-blue-600 dark:text-blue-400" weight="duotone" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Smart Email</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                        AI drafts, sends, and manages your emails automatically. From team updates to client communications.
                      </p>
                      <button
                        onClick={() => {
                          const chatInput = document.querySelector('textarea[placeholder*="Send a message"]');
                          if (chatInput) {
                            chatInput.value = '@agent send an email to team@company.com about our Q4 results';
                            chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                            chatInput.focus();
                          }
                        }}
                        className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:gap-3 transition-all"
                      >
                        Try it now <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Intelligent Scheduling */}
                  <div className="group">
                    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl flex items-center justify-center mb-6">
                        <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" weight="duotone" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Smart Scheduling</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                        Schedule meetings, set reminders, and manage your calendar with natural language commands.
                      </p>
                      <button
                        onClick={() => {
                          const chatInput = document.querySelector('textarea[placeholder*="Send a message"]');
                          if (chatInput) {
                            chatInput.value = '@agent schedule a meeting for tomorrow at 2pm with the product team';
                            chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                            chatInput.focus();
                          }
                        }}
                        className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-medium hover:gap-3 transition-all"
                      >
                        Schedule now <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Workflow Automation */}
                  <div className="group">
                    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl flex items-center justify-center mb-6">
                        <FlowArrow className="w-8 h-8 text-purple-600 dark:text-purple-400" weight="duotone" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Custom Workflows</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                        Create intelligent workflows that connect your tools and automate complex business processes.
                      </p>
                      <button
                        onClick={() => {
                          const chatInput = document.querySelector('textarea[placeholder*="Send a message"]');
                          if (chatInput) {
                            chatInput.value = '@agent create a new workflow for me';
                            chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                            chatInput.focus();
                          }
                        }}
                        className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium hover:gap-3 transition-all"
                      >
                        Create workflow <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Your Flows Section - Only show if flows exist */}
                {flows.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                      <FlowArrow className="w-6 h-6 text-blue-600" />
                      Your Active Workflows
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {flows.map((flow, index) => (
                        <button
                          key={flow.uuid || index}
                          onClick={() => {
                            const chatInput = document.querySelector('textarea[placeholder*="Send a message"]');
                            if (chatInput) {
                              chatInput.value = `@agent Execute the "${flow.name}" workflow`;
                              chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                              chatInput.focus();
                            }
                          }}
                          className="group bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg group-hover:scale-110 transition-transform">
                              <Play className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white text-sm">{flow.name}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                            {flow.description || `${flow.steps?.length || 0} ${t('homePage.steps')}`}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Interface - Compact and focused */}
            <div className="flex-1 min-h-0">
              <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50">
                <WorkspaceChat 
                  loading={loading} 
                  workspace={workspace}
                />
              </div>
            </div>
          </div>
        ) : (
          // Demo chat when no workspace exists
          <div className="flex flex-col h-full">
            {/* Hero Section */}
            <div className="relative px-4 py-12 sm:py-16 lg:py-20">
              <div className="max-w-4xl mx-auto text-center">
                {/* Hero Content */}
                <div className="mb-8">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                    Achieve More with
                    <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Intelligent AI
                    </span>
                  </h1>
                  <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
                    Turn your ideas into action. Let AI handle your workflows, emails, scheduling, and automation.
                  </p>
                  
                  {/* CTA Section */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      onClick={() => showModal()}
                      className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                    >
                      <Plus className="w-6 h-6" />
                      <span>Create Your First Workspace</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Just type <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-blue-600 dark:text-blue-400">@agent</code> to begin
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Demo Chat Interface */}
            <div className="flex-1 min-h-0">
              <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="h-full flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Sparkle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">Demo Chat</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">See how AI can help with your business</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span>Live Demo</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Demo Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {DEMO_CHAT_MESSAGES.map((message) => (
                      <div
                        key={message.uuid}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          <div className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Demo Input */}
                  <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">
                        Type your message here to start chatting...
                      </div>
                      <button
                        onClick={() => showModal()}
                        className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl transition-all duration-300 hover:shadow-lg"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* AI Enterprise Platform Section - Shows for all users */}
      <div className="px-4 py-16">
        <AIEnterprisePlatform />
        <ProfessionalDemo />
      </div>
      
      {showingNewWorkspace && <NewWorkspaceModal hideModal={hideModal} />}
    </div>
  );
}