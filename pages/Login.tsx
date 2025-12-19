import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../services/database';
import { OwlLogo } from '../components/OwlLogo';
import { Loader2, ArrowLeft } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

export const Login: React.FC<Props> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');
    
    try {
      const user = await db.clientLogin(email, password);
      if (user) {
        onLogin();
        navigate('/');
      } else {
        setError('Invalid credentials. Please check your email and password.');
      }
    } catch (err) {
      setError('An error occurred during login.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <Link to="/onboarding" className="flex items-center text-slate-400 hover:text-slate-600 mb-6 text-sm">
           <ArrowLeft size={16} className="mr-1" /> Back to Signup
        </Link>
        
        <div className="flex justify-center mb-6">
           <OwlLogo size={56} />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Welcome Back</h1>
        <p className="text-center text-slate-500 mb-8">Access your ThoughtVoice dashboard.</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-tv-teal focus:outline-none" 
              placeholder="you@company.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <input 
              type="password" 
              required
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-tv-teal focus:outline-none" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isLoggingIn}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
          >
            {isLoggingIn ? <Loader2 className="animate-spin" /> : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-400">
          <p>Demo Password: <span className="font-mono text-slate-600">password123</span></p>
        </div>
      </div>
    </div>
  );
};