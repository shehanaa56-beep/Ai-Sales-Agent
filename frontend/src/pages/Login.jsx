import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useCompany } from '../context/CompanyContext';
import { db } from '../firebase/config';
import { collection, getDocs, limit, query } from 'firebase/firestore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { activeCompanyId, setActiveCompanyId } = useCompany();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Auto-connect to a real company if currently using a test ID or none
      const currentId = localStorage.getItem('activeCompanyId');
      if (!currentId || currentId.startsWith('company_test_')) {
        const q = query(collection(db, 'companies'), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const firstCompanyId = snap.docs[0].id;
          setActiveCompanyId(firstCompanyId);
          console.log("🚀 Auto-connected to real company:", firstCompanyId);
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      let message = 'An error occurred during sign in.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please try again later.';
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-green/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      
      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-brand-green rounded-xl flex items-center justify-center shadow-lg shadow-brand-green/20 mb-4 transform rotate-3">
              <Sparkles className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">AI Sales Agent</h1>
            <p className="text-slate-400 mt-2 text-sm">Elevate your commerce with AI intelligence</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-brand-green transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-brand-green transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/50 text-white font-semibold rounded-xl shadow-lg shadow-brand-green/20 transition-all transform active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-xs">
              &copy; 2026 AI Sales Platform. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
