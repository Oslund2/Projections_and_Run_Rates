import { ReactNode, useRef } from 'react';
import * as React from 'react';
import { BarChart3, ClipboardList, Settings, TrendingUp, Users, Target, Activity, Bell, Menu, X, Building2, DollarSign, Tv } from 'lucide-react';
import { ChatWidget, ChatWidgetRef } from './ChatWidget';
import { NavigationTooltip } from './NavigationTooltip';

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  selectedAgentId?: string;
  selectedDivision?: string | null;
  onChatPromptTrigger?: (prompt: string) => void;
}

export function Layout({ children, currentView, onViewChange, selectedAgentId, selectedDivision }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const chatWidgetRef = useRef<ChatWidgetRef>(null);

  const handleChatPromptTrigger = (prompt: string) => {
    chatWidgetRef.current?.openWithPrompt(prompt);
  };
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, description: 'Executive overview of AI impact' },
    { id: 'agents', label: 'Agents', icon: Users, description: 'Add & Explore Agents' },
    { id: 'studies', label: 'Studies', icon: ClipboardList, description: 'Evidence validating Agent effectiveness' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Deep dive into performance metrics' },
    { id: 'goals', label: 'Goals', icon: Target, description: 'Efficiencies achieved by a date' },
    { id: 'forecasting', label: 'Forecasting', icon: Activity, description: 'Go forward look based on statistical evidence' },
    { id: 'alerts', label: 'Alerts', icon: Bell, description: 'Status of Agent success metrics' },
    { id: 'divisions', label: 'Divisions', icon: Building2, description: 'Organize agents by business units' },
    { id: 'costs', label: 'Costs', icon: DollarSign, description: 'Platform, Tokens, AI Team' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Configure system preferences' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-sm">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">Projections & Run Rates</h1>
                <p className="text-xs text-slate-600 hidden sm:block">AI Agent & Platform Tracking</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center">
              <NavigationTooltip content="Open TV Display Mode - Perfect for office monitors">
                <a
                  href="?mode=tv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                  aria-label="Open TV Display"
                >
                  <Tv className="w-4 h-4" />
                </a>
              </NavigationTooltip>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          <div className="hidden lg:flex lg:gap-2 lg:pb-3 lg:flex-wrap">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <NavigationTooltip key={item.id} content={item.description}>
                  <button
                    onClick={() => onViewChange(item.id)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    aria-label={`${item.label} - ${item.description}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm whitespace-nowrap">{item.label}</span>
                  </button>
                </NavigationTooltip>
              );
            })}
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 pt-2 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-start space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs text-slate-500 font-normal mt-0.5">{item.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {React.cloneElement(children as React.ReactElement, { onChatPromptTrigger: handleChatPromptTrigger })}
      </main>

      <ChatWidget ref={chatWidgetRef} currentView={currentView} selectedAgentId={selectedAgentId} selectedDivision={selectedDivision} />
    </div>
  );
}
