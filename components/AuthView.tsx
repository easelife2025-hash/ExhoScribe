'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, signInWithPopup, updateProfile } from 'firebase/auth';
import { Mail, Lock, User as UserIcon, ArrowRight, Fingerprint, Chrome, AlertCircle, CheckCircle } from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess: () => void;
}

type AuthState = 'welcome' | 'login' | 'signup' | 'forgot' | 'verify' | 'onboarding' | 'biometric';

export default function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [authState, setAuthState] = useState<AuthState>('welcome');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        setAuthState('verify');
      } else {
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await sendEmailVerification(userCredential.user);
      setAuthState('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearMessages();
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('Password reset email sent. Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex-1 bg-white flex flex-col min-h-[100dvh] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-96 bg-brand-50/50 rounded-b-[60px] -z-10" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-100/40 rounded-full blur-3xl -z-10" />
      
      <div className="flex-1 flex flex-col justify-center p-6 pt-[max(env(safe-area-inset-top),3rem)] pb-[max(env(safe-area-inset-bottom),2rem)]">
        
        <AnimatePresence mode="wait">
          
          {/* WELCOME */}
          {authState === 'welcome' && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col h-full justify-between">
              <div className="flex-1 flex flex-col justify-center items-center text-center">
                <div className="w-20 h-20 bg-brand-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-brand-500/20">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="white" fillOpacity="0.3"/>
                      <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="white"/>
                   </svg>
                </div>
                <h1 className="text-3xl font-display font-semibold text-slate-900 mb-3">NoteFlow</h1>
                <p className="text-slate-500 max-w-[280px]">Your AI-powered memory. Capture, transcribe, and remember everything.</p>
              </div>
              <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
                <button onClick={() => setAuthState('signup')} className="w-full py-4 bg-brand-600 text-white rounded-xl font-semibold shadow-[0_8px_30px_rgba(79,70,229,0.3)] active:scale-95 transition-all">
                  Get Started
                </button>
                <button onClick={() => setAuthState('login')} className="w-full py-4 bg-white text-slate-700 rounded-xl font-medium shadow-[0_2px_8px_rgb(0,0,0,0.04)] active:bg-slate-50 active:scale-95 transition-all">
                  I already have an account
                </button>
              </div>
            </motion.div>
          )}

          {/* LOGIN */}
          {authState === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
               <div className="mb-10">
                 <h2 className="text-2xl font-display font-semibold text-slate-900 mb-2">Welcome back</h2>
                 <p className="text-slate-500">Sign in to access your notes.</p>
               </div>
               
               {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 border border-red-100"><AlertCircle className="w-4 h-4"/>{error}</div>}

               <form onSubmit={handleLogin} className="flex flex-col gap-4 flex-1">
                 <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input required type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)] rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow" />
                 </div>
                 <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input required type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)] rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow" />
                 </div>
                 <button type="button" onClick={() => { clearMessages(); setAuthState('forgot'); }} className="text-sm font-medium text-brand-600 self-end mt-1">Forgot password?</button>
                 
                 <div className="mt-8">
                   <button disabled={loading} type="submit" className="w-full py-4 bg-brand-600 text-white rounded-xl font-semibold shadow-[0_8px_30px_rgba(79,70,229,0.3)] active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center gap-2">
                     {loading ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-5 h-5" />
                   </button>
                 </div>
                 
                 <div className="relative my-6 text-center">
                   <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                   <span className="relative bg-white px-4 text-xs font-medium text-slate-400 uppercase tracking-widest">Or</span>
                 </div>
                 
                 <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full py-4 bg-white text-slate-700 rounded-xl font-medium shadow-[0_2px_8px_rgb(0,0,0,0.04)] active:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-3">
                   <Chrome className="w-5 h-5" /> Continue with Google
                 </button>
               </form>
               
               <p className="text-center text-sm text-slate-500 mt-auto pt-6">
                 Don&apos;t have an account? <button onClick={() => { clearMessages(); setAuthState('signup'); }} className="text-brand-600 font-medium">Sign Up</button>
               </p>
            </motion.div>
          )}

          {/* SIGNUP */}
          {authState === 'signup' && (
            <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
               <div className="mb-10">
                 <h2 className="text-2xl font-display font-semibold text-slate-900 mb-2">Create account</h2>
                 <p className="text-slate-500">Start capturing your thoughts.</p>
               </div>
               
               {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 border border-red-100"><AlertCircle className="w-4 h-4"/>{error}</div>}

               <form onSubmit={handleSignup} className="flex flex-col gap-4 flex-1">
                 <div className="relative">
                   <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input required type="text" placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)] rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow" />
                 </div>
                 <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input required type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)] rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow" />
                 </div>
                 <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input required type="password" placeholder="Password (min 6 chars)" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} className="w-full bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)] rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow" />
                 </div>
                 
                 <div className="mt-8">
                   <button disabled={loading} type="submit" className="w-full py-4 bg-brand-600 text-white rounded-xl font-semibold shadow-[0_8px_30px_rgba(79,70,229,0.3)] active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center gap-2">
                     {loading ? 'Creating...' : 'Sign Up'} <ArrowRight className="w-5 h-5" />
                   </button>
                 </div>
               </form>
               
               <p className="text-center text-sm text-slate-500 mt-auto pt-6">
                 Already have an account? <button onClick={() => { clearMessages(); setAuthState('login'); }} className="text-brand-600 font-medium">Sign In</button>
               </p>
            </motion.div>
          )}

          {/* FORGOT PASSWORD */}
          {authState === 'forgot' && (
            <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
               <div className="mb-10">
                 <h2 className="text-2xl font-display font-semibold text-slate-900 mb-2">Reset Password</h2>
                 <p className="text-slate-500">Enter your email to receive a link.</p>
               </div>
               
               {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 border border-red-100"><AlertCircle className="w-4 h-4"/>{error}</div>}
               {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-sm flex items-center gap-2 border border-green-100"><CheckCircle className="w-4 h-4"/>{successMsg}</div>}

               <form onSubmit={handleForgotPassword} className="flex flex-col gap-4 flex-1">
                 <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input required type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)] rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow" />
                 </div>
                 
                 <div className="mt-8">
                   <button disabled={loading} type="submit" className="w-full py-4 bg-brand-600 text-white rounded-xl font-semibold shadow-[0_8px_30px_rgba(79,70,229,0.3)] active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center gap-2">
                     {loading ? 'Sending...' : 'Send Reset Link'} <ArrowRight className="w-5 h-5" />
                   </button>
                 </div>
               </form>
               
               <button onClick={() => { clearMessages(); setAuthState('login'); }} className="text-center text-sm font-medium text-slate-500 mt-auto pt-6 hover:text-slate-800">
                 Back to login
               </button>
            </motion.div>
          )}

          {/* VERIFY EMAIL */}
          {authState === 'verify' && (
            <motion.div key="verify" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-full justify-center items-center text-center">
               <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-8">
                 <Mail className="w-10 h-10 text-teal-600" />
               </div>
               <h2 className="text-2xl font-display font-semibold text-slate-900 mb-3">Verify your email</h2>
               <p className="text-slate-500 max-w-[280px] mb-10">We&apos;ve sent a verification link to <span className="font-medium text-slate-900">{email}</span>. Please verify to continue.</p>
               
               <button onClick={onAuthSuccess} className="w-full py-4 bg-brand-600 text-white rounded-2xl font-medium shadow-lg shadow-brand-500/25 active:scale-[0.98] transition-all flex justify-center items-center gap-2">
                 I&apos;ve verified my email <ArrowRight className="w-5 h-5" />
               </button>
               <button onClick={() => window.location.reload()} className="mt-4 text-sm font-medium text-slate-500 hover:text-slate-800">
                 Refresh page
               </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
