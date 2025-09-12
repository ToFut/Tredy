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
          // Clean onboarding when no workspace exists
          <div className="flex items-center justify-center h-full px-4 py-16">
            <div className="text-center max-w-2xl">
              {/* Simple, elegant welcome */}
              <div className="mb-12">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <Sparkle className="w-10 h-10 text-white" weight="fill" />
                </div>
                
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  Welcome to AnythingLLM
                </h1>
                
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                  Your intelligent AI assistant is ready to help with emails, scheduling, workflows, and more.
                </p>
                
                <button
                  onClick={() => showModal()}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  <Plus className="w-6 h-6" />
                  Create Your First Workspace
                </button>
              </div>
              
              {/* Simple feature preview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <EnvelopeSimple className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Smart Email</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered email management</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Scheduling</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Intelligent calendar management</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FlowArrow className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Workflows</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Custom automation flows</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {showingNewWorkspace && <NewWorkspaceModal hideModal={hideModal} />}
    </div>
  );
}