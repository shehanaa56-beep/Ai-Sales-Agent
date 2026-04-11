import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Conversations from './pages/Conversations';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Products from './pages/Products';
import AiAgents from './pages/AiAgents';
import KnowledgeBase from './pages/KnowledgeBase';
import Analytics from './pages/Analytics';
import Automations from './pages/Automations';
import Settings from './pages/Settings';
import Companies from './pages/Companies';
import Appointments from './pages/Appointments';
import Login from './pages/Login';
import PublicCheckout from './pages/PublicCheckout';
import { CompanyProvider } from './context/CompanyContext';
import { auth } from './firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Global error listener for hard crashes on mobile
    const handleGlobalError = (event) => {
      console.error("Caught global error:", event.error);
      // Optional: alert it for extreme debugging if needed
      // alert("Init Error: " + event.message);
    };
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalError);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleGlobalError);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const renderPage = () => {
    switch(activePage) {
      case 'Companies': return <Companies setActivePage={setActivePage} />;
      case 'Dashboard': return <Dashboard setActivePage={setActivePage} />;
      case 'Conversations': return <Conversations setActivePage={setActivePage} />;
      case 'Orders': return <Orders setActivePage={setActivePage} />;
      case 'Customers': return <Customers setActivePage={setActivePage} />;
      case 'Products': return <Products setActivePage={setActivePage} />;
      case 'AI Agents': return <AiAgents setActivePage={setActivePage} />;
      case 'Knowledge Base': return <KnowledgeBase setActivePage={setActivePage} />;
      case 'Analytics': return <Analytics setActivePage={setActivePage} />;
      case 'Automations': return <Automations setActivePage={setActivePage} />;
      case 'Settings': return <Settings setActivePage={setActivePage} />;
      case 'Appointments': return <Appointments setActivePage={setActivePage} />;
      default: return <Dashboard setActivePage={setActivePage} />;
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const getPageSubtitle = () => {
    switch(activePage) {
      case 'Companies': return 'Manage corporate clients & tenants';
      case 'Dashboard': return 'Welcome back, Admin';
      case 'Conversations': return 'AI-powered customer interactions';
      case 'Orders': return 'Manage and track all orders';
      case 'Customers': return 'CRM & customer intelligence';
      case 'Products': return 'Product catalog & AI recommendations';
      case 'AI Agents': return 'Manage your AI workforce';
      case 'Knowledge Base': return 'Configure your AI knowledge base';
      case 'Analytics': return 'Business intelligence & AI performance';
      case 'Automations': return 'Configure AI-powered workflows';
      case 'Settings': return 'Manage your account and preferences';
      case 'Appointments': return 'Manage patient bookings and schedules';
      default: return '';
    }
  };

  const path = window.location.pathname;

  return (
    <CompanyProvider>
      {(() => {
        if (path.startsWith('/pay/')) {
          const orderId = path.split('/pay/')[1];
          return <PublicCheckout orderId={orderId} />;
        }

        if (loading) {
          return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a]">
              <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
            </div>
          );
        }

        if (!isAuthenticated) {
          return <Login />;
        }

        return (
          <div className="flex h-screen w-screen overflow-hidden bg-body-bg">
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                onClick={closeSidebar}
              />
            )}

            <Sidebar 
              activePage={activePage} 
              setActivePage={(page) => { setActivePage(page); closeSidebar(); }} 
              onLogout={handleLogout} 
              isOpen={isSidebarOpen}
              onClose={closeSidebar}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
              <Header 
                title={activePage} 
                subtitle={getPageSubtitle()} 
                onMenuClick={toggleSidebar}
                isSidebarOpen={isSidebarOpen}
              />
              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                {renderPage()}
              </div>
            </div>
          </div>
        );
      })()}
    </CompanyProvider>
  );
}

export default App;
