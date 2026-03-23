import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Conversations from './pages/Conversations';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Products from './pages/Products';
import AiAgents from './pages/AiAgents';
import Analytics from './pages/Analytics';
import Automations from './pages/Automations';
import Settings from './pages/Settings';
import './index.css';

function App() {
  const [activePage, setActivePage] = useState('Settings'); // Set to settings for testing

  const renderPage = () => {
    switch(activePage) {
      case 'Dashboard': return <Dashboard />;
      case 'Conversations': return <Conversations />;
      case 'Orders': return <Orders />;
      case 'Customers': return <Customers />;
      case 'Products': return <Products />;
      case 'AI Agents': return <AiAgents />;
      case 'Analytics': return <Analytics />;
      case 'Automations': return <Automations />;
      case 'Settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  const getPageSubtitle = () => {
    switch(activePage) {
      case 'Dashboard': return 'Welcome back, Admin';
      case 'Conversations': return 'AI-powered customer interactions';
      case 'Orders': return 'Manage and track all orders';
      case 'Customers': return 'CRM & customer intelligence';
      case 'Products': return 'Product catalog & AI recommendations';
      case 'AI Agents': return 'Manage your AI workforce';
      case 'Analytics': return 'Business intelligence & AI performance';
      case 'Automations': return 'Configure AI-powered workflows';
      case 'Settings': return 'Manage your account and preferences';
      default: return '';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden bg-body-bg">
        <Header title={activePage} subtitle={getPageSubtitle()} />
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default App;
