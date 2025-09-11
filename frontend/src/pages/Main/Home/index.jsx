import React, { useState, useEffect } from "react";
import { Sparkle, Plus, Robot, EnvelopeSimple, Calendar, LinkedinLogo, FileText, ChartBar, Play, FlowArrow, Globe } from "@phosphor-icons/react";
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tredy Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Robot className="w-6 h-6 text-yellow-300" weight="fill" />
            <h1 className="text-lg font-bold">
              {user?.username ? t('homePage.welcomeWithName', { username: user.username }) : t('homePage.welcomeHeader')} 🚀
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">
              {t('homePage.aiAssistantReady')}
            </div>
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{getLanguageName(currentLanguage)}</span>
              </button>
              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                  {supportedLanguages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        changeLanguage(lang);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        lang === currentLanguage ? 'bg-gray-100 dark:bg-gray-700 font-semibold' : 'text-gray-700 dark:text-gray-300'
                      } ${lang === supportedLanguages[0] ? 'rounded-t-lg' : ''} ${
                        lang === supportedLanguages[supportedLanguages.length - 1] ? 'rounded-b-lg' : ''
                      }`}
                    >
                      {getLanguageName(lang)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat Container */}
      <div className="flex-1 overflow-hidden">
        {workspace ? (
          <div className="flex flex-col h-full">
            {/* Flow Agent Quick Actions */}
            <div className="bg-gradient-to-b from-purple-50 to-white dark:from-gray-800 dark:to-gray-900 p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FlowArrow className="w-5 h-5 text-purple-500" />
                  {flows.length > 0 ? t('homePage.flowAgentsTitle') : t('homePage.quickActionsTitle')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {flows.length > 0 ? (
                    // Show real flows from the system
                    flows.map((flow, index) => (
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
                        className="group bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg group-hover:from-purple-200 group-hover:to-pink-200 dark:group-hover:from-purple-900/50 dark:group-hover:to-pink-900/50">
                            <Play className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="font-medium text-base sm:text-sm text-gray-900 dark:text-white truncate">{flow.name}</p>
                            <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                              {flow.description || `${flow.steps?.length || 0} ${t('homePage.steps')}`}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    // Show default quick actions if no flows exist
                    <>
                      <button
                        onClick={() => {
                          const chatInput = document.querySelector('textarea[placeholder*="Send a message"]');
                          if (chatInput) {
                            chatInput.value = '@agent send an email to team@company.com about our Q4 results';
                            chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                            chatInput.focus();
                          }
                        }}
                        className="group bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50">
                            <EnvelopeSimple className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-base sm:text-sm text-gray-900 dark:text-white">{t('homePage.emailFlow')}</p>
                            <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400">{t('homePage.emailFlowDesc')}</p>
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          const chatInput = document.querySelector('textarea[placeholder*="Send a message"]');
                          if (chatInput) {
                            chatInput.value = '@agent schedule a meeting for tomorrow at 2pm with the product team';
                            chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                            chatInput.focus();
                          }
                        }}
                        className="group bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-400 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50">
                            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-base sm:text-sm text-gray-900 dark:text-white">{t('homePage.calendarFlow')}</p>
                            <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400">{t('homePage.calendarFlowDesc')}</p>
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          const chatInput = document.querySelector('textarea[placeholder*="Send a message"]');
                          if (chatInput) {
                            chatInput.value = '@agent post on LinkedIn about our new product launch';
                            chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                            chatInput.focus();
                          }
                        }}
                        className="group bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50">
                            <LinkedinLogo className="w-5 h-5 text-blue-700 dark:text-blue-500" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-base sm:text-sm text-gray-900 dark:text-white">{t('homePage.linkedinFlow')}</p>
                            <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400">{t('homePage.linkedinFlowDesc')}</p>
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          const chatInput = document.querySelector('textarea[placeholder*="Send a message"]');
                          if (chatInput) {
                            chatInput.value = '@agent create a new workflow for me';
                            chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                            chatInput.focus();
                          }
                        }}
                        className="group bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50">
                            <Plus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-base sm:text-sm text-gray-900 dark:text-white">{t('homePage.createFlow')}</p>
                            <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400">{t('homePage.createFlowDesc')}</p>
                          </div>
                        </div>
                      </button>
                    </>
                  )}
                </div>
                
                {/* Welcome Message */}
                <div className="mt-3 p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">👋 {t('homePage.welcomeMessage')}</span> {t('homePage.welcomeMessageDesc')} <code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded text-sm sm:text-xs font-mono">@agent</code> {t('homePage.welcomeMessageDesc2')}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Chat Interface */}
            <div className="flex-1 overflow-hidden">
              <WorkspaceChat 
                loading={loading} 
                workspace={workspace}
              />
            </div>
          </div>
        ) : (
          // Fallback when no workspace is available
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
            <div className="text-center max-w-2xl p-8">
              {/* Welcome Animation */}
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                  <Sparkle className="w-12 h-12 text-white" weight="fill" />
                </div>
                <div className="absolute -top-2 -right-12 w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkle className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4">
                {user?.username ? t('homePage.welcomeWithName', { username: user.username }) : t('homePage.noWorkspaceTitle')}
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                {t('homePage.noWorkspaceDesc')}
                <span className="block mt-2 text-base font-medium text-purple-600 dark:text-purple-400">
                  {t('homePage.createFirstWorkspace')}
                </span>
              </p>
              
              <button
                onClick={showModal}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                <Plus className="w-6 h-6" />
                <span>{t('homePage.createWorkspaceBtn')}</span>
              </button>
              
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-xl mx-auto">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-700">
                  <div className="text-2xl mb-2">✉️</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('homePage.emailWorkflows')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('homePage.emailWorkflowsDesc')}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-700">
                  <div className="text-2xl mb-2">📅</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('homePage.smartScheduling')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('homePage.smartSchedulingDesc')}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-700">
                  <div className="text-2xl mb-2">🚀</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('homePage.flowAutomation')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('homePage.flowAutomationDesc')}</p>
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