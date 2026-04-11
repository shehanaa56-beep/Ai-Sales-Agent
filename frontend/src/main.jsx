import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Simple Error Boundary for Mobile Debugging
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical Runtime Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Application Crash</h1>
          <p className="text-slate-400 mb-6">A critical error occurred while loading the app.</p>
          <div className="bg-slate-800 p-4 rounded-lg text-left text-xs font-mono max-w-full overflow-auto border border-red-500/20">
            {this.state.error?.toString()}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-8 px-6 py-2 bg-brand-green rounded-full font-bold"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
