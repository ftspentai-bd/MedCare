import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Activity, Users, MessageSquare, ChevronRight, X, UserCircle2, Lock, ArrowRight, Heart } from 'lucide-react';

interface LandingPageProps {
  onLogin: (role: 'admin' | 'doctor' | 'patient') => void;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'signup' | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'bot' | 'user', text: string }[]>([
    { role: 'bot', text: 'Hello! I am MedBot. How can I assist you with your healthcare needs today?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    setChatMessages(prev => [...prev, { role: 'user', text: chatInput }]);
    
    const query = chatInput.toLowerCase();
    setChatInput('');
    
    setTimeout(() => {
      let response = "I can help you book an appointment, view patient records, or contact support. Please log in to access full features.";
      if (query.includes('appointment')) response = "Booking appointments can be done through the Patient Dashboard after logging in. You can select your preferred doctor and time slot.";
      else if (query.includes('emergency')) response = "If this is a medical emergency, please call your local emergency number immediately.";
      else if (query.includes('login') || query.includes('sign in')) response = "You can log in using the buttons at the top right of the page.";
      
      setChatMessages(prev => [...prev, { role: 'bot', text: response }]);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-900 border-b border-slate-800 text-slate-100 font-sans flex flex-col relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-teal-900/20 to-slate-900 z-0" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl z-0" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-3xl z-0" />

      {/* Navbar */}
      <nav className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-teal-500 to-emerald-500 p-2 rounded-xl shadow-lg">
            <Activity className="h-6 w-6 text-slate-950" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white font-mono">MedCare<span className="text-teal-400">AIO</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAuthModal('login')}
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => setShowAuthModal('signup')}
            className="text-sm font-bold bg-teal-600 hover:bg-teal-500 text-white px-5 py-2 rounded-lg transition-colors shadow-lg shadow-teal-500/20"
          >
            Create Account
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center -mt-10 px-6 text-center max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-teal-400 text-xs font-mono font-bold tracking-widest uppercase mx-auto">
            <Heart className="h-3 w-3" />
            <span>Next-Gen Cloud EMR</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
            Healthcare management, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">simplified.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A comprehensive unified platform for medical professionals to manage electronic records, digital scheduling, and automated billing seamlessly.
          </p>
        </motion.div>

        {/* Demo Roles Action Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16 w-full grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Admin Demo */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 text-left hover:bg-slate-800/80 transition-colors group">
            <div className="h-12 w-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Facility Admin</h3>
            <p className="text-sm text-slate-400 mb-6">Full system overview, practitioner management, clinic scheduling, and analytics.</p>
            <button 
              onClick={() => onLogin('admin')}
              className="w-full flex items-center justify-between px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-semibold text-slate-300 group-hover:text-white group-hover:border-indigo-500/30 transition-all"
            >
              <span>Launch Demo</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Doctor Demo */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 text-left hover:bg-slate-800/80 transition-colors group">
            <div className="h-12 w-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Specialist Doctor</h3>
            <p className="text-sm text-slate-400 mb-6">Patient roster, consultation execution, clinical vitals monitoring, and notes.</p>
            <button 
              onClick={() => onLogin('doctor')}
              className="w-full flex items-center justify-between px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-semibold text-slate-300 group-hover:text-white group-hover:border-emerald-500/30 transition-all"
            >
              <span>Launch Demo</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Patient Demo */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 text-left hover:bg-slate-800/80 transition-colors group">
            <div className="h-12 w-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 mb-4 border border-amber-500/20">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Patient Gateway</h3>
            <p className="text-sm text-slate-400 mb-6">Self-service booking, medical record access, digital invoices, and evaluations.</p>
            <button 
              onClick={() => onLogin('patient')}
              className="w-full flex items-center justify-between px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-semibold text-slate-300 group-hover:text-white group-hover:border-amber-500/30 transition-all"
            >
              <span>Launch Demo</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </main>

      {/* Floating Chatbot Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {showChatbot && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="mb-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-80 overflow-hidden flex flex-col"
              style={{ height: '400px' }}
            >
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-white" />
                  <span className="font-bold text-white text-sm">MedBot Assistant</span>
                </div>
                <button 
                  onClick={() => setShowChatbot(false)}
                  className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-800/50">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-teal-600 text-white' 
                        : 'bg-slate-700 text-slate-200 border border-slate-600'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 border-t border-slate-700 bg-slate-900">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-teal-500"
                  />
                  <button 
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-500 text-white p-2 rounded-xl transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => setShowChatbot(!showChatbot)}
          className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${
            showChatbot ? 'bg-slate-700 text-white' : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:scale-105'
          }`}
        >
          {showChatbot ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        </button>
      </div>

      {/* Auth Modal Overlay */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <button 
                onClick={() => setShowAuthModal(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors z-10"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="p-8">
                <div className="mb-8 text-center">
                  <div className="h-12 w-12 bg-teal-500/10 rounded-full flex items-center justify-center text-teal-400 mx-auto mb-4 border border-teal-500/20">
                    {showAuthModal === 'login' ? <Lock className="h-6 w-6" /> : <UserCircle2 className="h-6 w-6" />}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {showAuthModal === 'login' ? 'Welcome Back' : 'Create Account'}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {showAuthModal === 'login' ? 'Sign in to your MedCare account' : 'Join the modern healthcare network'}
                  </p>
                </div>
                
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onLogin('patient'); }}>
                  {showAuthModal === 'signup' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Full Name</label>
                      <input 
                        type="text" 
                        placeholder="John Doe" 
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="demo@example.com" 
                      value={showAuthModal === 'login' ? 'patient@demo.med' : ''}
                      onChange={() => {}}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={showAuthModal === 'login' ? 'password123' : ''}
                      onChange={() => {}}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-600"
                    />
                  </div>
                  
                  {showAuthModal === 'login' && (
                    <div className="flex items-center justify-end">
                      <a href="#" className="text-xs text-teal-400 hover:text-teal-300">Forgot password?</a>
                    </div>
                  )}
                  
                  <button 
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm py-3 rounded-lg shadow-lg shadow-teal-500/20 transition-all mt-6"
                  >
                    {showAuthModal === 'login' ? 'Sign In (Demo)' : 'Sign Up (Demo)'}
                  </button>
                </form>
                
                <div className="mt-8 text-center border-t border-slate-800 pt-6 font-mono text-xs">
                  <p className="text-slate-500">
                    {showAuthModal === 'login' ? "Don't have an account?" : "Already have an account?"}
                  </p>
                  <button 
                    onClick={() => setShowAuthModal(showAuthModal === 'login' ? 'signup' : 'login')}
                    className="text-teal-400 font-bold hover:text-teal-300 mt-2 hover:underline"
                  >
                    {showAuthModal === 'login' ? 'Create one now' : 'Sign in instead'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
