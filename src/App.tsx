import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AgentList } from './components/AgentList';
import { AgentDetail } from './components/AgentDetail';
import { StudyList } from './components/StudyList';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { Goals } from './components/Goals';
import { Forecasting } from './components/Forecasting';
import { Alerts } from './components/Alerts';
import DivisionManagement from './components/DivisionManagement';
import CostTracking from './components/CostTracking';
import { TVDisplay } from './components/TVDisplay';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [showTVDisplay, setShowTVDisplay] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    console.log('App: Checking URL params:', window.location.search);
    if (params.get('mode') === 'tv') {
      console.log('App: TV mode detected, showing TV display');
      setShowTVDisplay(true);
    }
  }, []);

  if (showTVDisplay) {
    console.log('App: Rendering TV Display');
    return <TVDisplay />;
  }

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    setSelectedAgentId(null);
  };

  const handleDivisionChange = (divisionId: string | null) => {
    setSelectedDivision(divisionId);
  };

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setCurrentView('agent-detail');
  };

  const handleBackFromAgent = () => {
    setSelectedAgentId(null);
    setCurrentView('agents');
  };

  const renderContent = () => {
    if (currentView === 'agent-detail' && selectedAgentId) {
      return <AgentDetail agentId={selectedAgentId} onBack={handleBackFromAgent} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard onDivisionChange={handleDivisionChange} />;
      case 'agents':
        return <AgentList onSelectAgent={handleSelectAgent} />;
      case 'studies':
        return <StudyList />;
      case 'analytics':
        return <Analytics />;
      case 'goals':
        return <Goals />;
      case 'forecasting':
        return <Forecasting />;
      case 'alerts':
        return <Alerts />;
      case 'divisions':
        return <DivisionManagement />;
      case 'costs':
        return <CostTracking />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onDivisionChange={handleDivisionChange} />;
    }
  };

  return (
    <Layout
      currentView={currentView}
      onViewChange={handleViewChange}
      selectedAgentId={selectedAgentId || undefined}
      selectedDivision={selectedDivision}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
