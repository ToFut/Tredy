import React, { useState, useEffect } from "react";
import { 
  Sparkle, Plus, EnvelopeSimple, Calendar, Play, FlowArrow, Globe, ArrowRight,
  Building, Users, User, CaretRight, CaretDown, ChartBar, Brain, 
  X, Menu, Monitor, Smartphone, Tablet
} from "@phosphor-icons/react";
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
  const [activeStage, setActiveStage] = useState('business');
  const [rightMenuOpen, setRightMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { showing: showingNewWorkspace, showModal, hideModal } = useNewWorkspaceModal();

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const stages = [
    {
      id: 'business',
      name: 'Business Team',
      icon: Building,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      description: 'Enterprise workflow automation & analytics'
    },
    {
      id: 'saas',
      name: 'SaaS Platform',
      icon: Monitor,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      description: 'Website view with embedded chat'
    },
    {
      id: 'personal',
      name: 'Personal Assistant',
      icon: User,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
      description: 'Individual productivity & automation'
    }
  ];

  const renderStageContent = () => {
    switch (activeStage) {
      case 'business':
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3`}>
                <ChartBar className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                Business Analytics Dashboard
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-3 md:p-4">
                  <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-700 dark:text-green-300`}>$2.4M</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Q4 Revenue</div>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl p-3 md:p-4">
                  <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-blue-700 dark:text-blue-300`}>+23%</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Growth Rate</div>
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-xl p-3 md:p-4">
                  <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-purple-700 dark:text-purple-300`}>156</div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Active Clients</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 dark:text-white mb-4`}>Recent Tredy Results</h3>
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Lead Generation Campaign</span>
                  <span className="text-sm font-medium text-green-600">+45% conversion</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Customer Support Automation</span>
                  <span className="text-sm font-medium text-blue-600">-60% response time</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Sales Pipeline Optimization</span>
                  <span className="text-sm font-medium text-purple-600">+32% efficiency</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'saas':
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3`}>
                <Monitor className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                Website Integration View
              </h3>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 md:p-6">
                <div className={`flex items-center ${isMobile ? 'flex-col text-center' : 'gap-4'} mb-4`}>
                  <div className={`${isMobile ? 'mb-3' : ''} w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center`}>
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">AI Chat Widget</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Embedded intelligent assistant</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Live Chat Session:</div>
                  <div className="space-y-2">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm">
                      <strong>User:</strong> "How can I integrate your AI into my website?"
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm">
                      <strong>AI:</strong> "I can help you embed our intelligent chat widget. It supports real-time responses, custom branding, and seamless integration with your existing systems."
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 dark:text-white mb-4`}>Integration Analytics</h3>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="text-center p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-blue-600`}>1,247</div>
                  <div className="text-sm text-blue-600">Monthly Chats</div>
                </div>
                <div className="text-center p-3 md:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>94%</div>
                  <div className="text-sm text-green-600">Satisfaction Rate</div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'personal':
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3`}>
                <User className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                Personal Productivity Hub
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <EnvelopeSimple className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-900 dark:text-white">Email Management</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">23 emails processed today</div>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900 dark:text-white">Schedule</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">3 meetings scheduled</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 dark:text-white mb-4`}>Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">Send Email</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Quick compose</div>
                </button>
                <button className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">Schedule Meeting</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Calendar integration</div>
                </button>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

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
          <div className={`${isMobile ? 'flex flex-col' : 'flex'} h-full`}>
            {/* Left Sidebar - Intelligence Stages */}
            <div className={`${isMobile ? 'w-full h-auto border-b' : 'w-80 border-r'} bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 flex flex-col`}>
              {/* Header */}
              <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Intelligence Stage
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose your workspace focus
                </p>
              </div>
              
              {/* Stage Tabs */}
              <div className={`${isMobile ? 'p-4' : 'flex-1 p-4'} ${isMobile ? 'flex space-x-2' : 'space-y-2'}`}>
                {stages.map((stage) => {
                  const IconComponent = stage.icon;
                  const isActive = activeStage === stage.id;
                  
                  return (
                    <button
                      key={stage.id}
                      onClick={() => setActiveStage(stage.id)}
                      className={`${isMobile ? 'flex-1' : 'w-full'} p-4 rounded-xl transition-all duration-200 text-left ${
                        isActive 
                          ? `bg-gradient-to-r ${stage.color} text-white shadow-lg` 
                          : 'bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className={`flex items-center ${isMobile ? 'flex-col gap-2' : 'gap-3 mb-2'}`}>
                        <div className={`p-2 rounded-lg ${
                          isActive 
                            ? 'bg-white/20' 
                            : `bg-gradient-to-br ${stage.bgColor}`
                        }`}>
                          <IconComponent className={`w-5 h-5 ${
                            isActive ? 'text-white' : `text-${stage.color.split('-')[1]}-600`
                          }`} />
                        </div>
                        <div className={`${isMobile ? 'text-center' : ''}`}>
                          <div className="font-semibold text-sm">{stage.name}</div>
                          {!isMobile && (
                            <div className={`text-xs ${
                              isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {stage.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Center Content - Dashboard */}
            <div className={`${isMobile ? 'flex-1' : 'flex-1'} flex flex-col min-w-0`}>
              {/* Top Bar */}
              <div className={`${isMobile ? 'p-4' : 'p-6'} border-b border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm`}>
                <div className={`flex items-center ${isMobile ? 'flex-col gap-3' : 'justify-between'}`}>
                  <div className={`${isMobile ? 'text-center' : ''}`}>
                    <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 dark:text-white`}>
                      {stages.find(s => s.id === activeStage)?.name} Dashboard
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stages.find(s => s.id === activeStage)?.description}
                    </p>
                  </div>
                  
                  {/* Right Menu Toggle */}
                  <button
                    onClick={() => setRightMenuOpen(!rightMenuOpen)}
                    className="p-2 bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-800 rounded-lg border border-gray-200/50 dark:border-gray-700/50 transition-colors"
                  >
                    <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              
              {/* Dashboard Content */}
              <div className={`flex-1 ${isMobile ? 'p-4' : 'p-6'} overflow-y-auto`}>
                {renderStageContent()}
              </div>
            </div>
            
            {/* Right Sidebar - Collapsible Menu */}
            {!isMobile && (
              <div className={`${rightMenuOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-l border-gray-200/50 dark:border-gray-700/50`}>
                {rightMenuOpen && (
                  <div className="w-80 h-full flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                      <button
                        onClick={() => setRightMenuOpen(false)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                    
                    {/* Menu Content */}
                    <div className="flex-1 p-4 space-y-4">
                      {/* Chat Interface */}
                      <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Brain className="w-4 h-4 text-blue-600" />
                          AI Assistant
                        </h4>
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              const chatInput = document.querySelector('textarea[placeholder*="Send a message"]');
                              if (chatInput) {
                                chatInput.value = '@agent help me with my business analytics';
                                chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                                chatInput.focus();
                              }
                            }}
                            className="w-full p-3 text-left bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          >
                            <div className="font-medium text-sm text-gray-900 dark:text-white">Business Analytics</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Get insights and reports</div>
                          </button>
                          <button
                            onClick={() => {
                              const chatInput = document.querySelector('textarea[placeholder*="Send a message"]');
                              if (chatInput) {
                                chatInput.value = '@agent create a workflow for lead generation';
                                chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                                chatInput.focus();
                              }
                            }}
                            className="w-full p-3 text-left bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                          >
                            <div className="font-medium text-sm text-gray-900 dark:text-white">Create Workflow</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Automate processes</div>
                          </button>
                        </div>
                      </div>
                      
                      {/* Recent Activity */}
                      <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent Activity</h4>
                        <div className="space-y-2 text-sm">
                          <div className="text-gray-600 dark:text-gray-400">• Email campaign sent</div>
                          <div className="text-gray-600 dark:text-gray-400">• Meeting scheduled</div>
                          <div className="text-gray-600 dark:text-gray-400">• Report generated</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Mobile Bottom Menu */}
            {isMobile && rightMenuOpen && (
              <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setRightMenuOpen(false)}>
                <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl p-4 max-h-[60vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                    <button
                      onClick={() => setRightMenuOpen(false)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Chat Interface */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-blue-600" />
                        AI Assistant
                      </h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            const chatInput = document.querySelector('textarea[placeholder*="Send a message"]');
                            if (chatInput) {
                              chatInput.value = '@agent help me with my business analytics';
                              chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                              chatInput.focus();
                            }
                            setRightMenuOpen(false);
                          }}
                          className="w-full p-3 text-left bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                          <div className="font-medium text-sm text-gray-900 dark:text-white">Business Analytics</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Get insights and reports</div>
                        </button>
                        <button
                          onClick={() => {
                            const chatInput = document.querySelector('textarea[placeholder*="Send a message"]');
                            if (chatInput) {
                              chatInput.value = '@agent create a workflow for lead generation';
                              chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                              chatInput.focus();
                            }
                            setRightMenuOpen(false);
                          }}
                          className="w-full p-3 text-left bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        >
                          <div className="font-medium text-sm text-gray-900 dark:text-white">Create Workflow</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Automate processes</div>
                        </button>
                      </div>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent Activity</h4>
                      <div className="space-y-2 text-sm">
                        <div className="text-gray-600 dark:text-gray-400">• Email campaign sent</div>
                        <div className="text-gray-600 dark:text-gray-400">• Meeting scheduled</div>
                        <div className="text-gray-600 dark:text-gray-400">• Report generated</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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