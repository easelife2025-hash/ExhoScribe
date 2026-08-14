'use client';

import { ViewState } from '../types';
import { Home, Mic, User, Calendar, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onStartRecording: () => void;
}

export default function BottomNav({ currentView, onChangeView, onStartRecording }: BottomNavProps) {
  // Hide nav during recording or transcript view
  if (currentView === 'recording' || currentView === 'transcript' || currentView === 'search') return null;

  return (
    <div className="absolute bottom-0 inset-x-0 bg-white/85 backdrop-blur-xl border-t border-slate-100 pb-safe-bottom z-40">
      <div className="flex items-center justify-around h-20 px-2 max-w-md mx-auto">
        <NavButton 
          icon={<Home className="w-6 h-6" strokeWidth={2} />} 
          label="Home" 
          isActive={currentView === 'home'} 
          onClick={() => onChangeView('home')} 
        />
        
        <NavButton 
          icon={<Calendar className="w-6 h-6" strokeWidth={2} />} 
          label="Calendar" 
          isActive={currentView === 'calendar'} 
          onClick={() => onChangeView('calendar')} 
        />

        {/* FAB Style Record Button */}
        <div className="relative -top-6 px-2">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartRecording}
            className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-[0_8px_30px_rgba(79,70,229,0.3)] border-[4px] border-slate-50"
          >
            <Mic className="w-7 h-7" strokeWidth={2} />
          </motion.button>
        </div>

        <NavButton 
          icon={<Users className="w-6 h-6" strokeWidth={2} />} 
          label="Teams" 
          isActive={currentView === 'workspaces'} 
          onClick={() => onChangeView('workspaces')} 
        />

        <NavButton 
          icon={<User className="w-6 h-6" strokeWidth={2} />} 
          label="Profile" 
          isActive={currentView === 'profile'} 
          onClick={() => onChangeView('profile')} 
        />
      </div>
    </div>
  );
}

function NavButton({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center w-16 h-14 gap-1 active:scale-95 transition-all ${isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <div className="relative flex items-center justify-center z-10 w-8 h-8">
        {isActive && (
          <motion.div 
            layoutId="navPill"
            className="absolute inset-0 bg-brand-100 rounded-full"
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        )}
        <div className="relative z-20">
          {icon}
        </div>
      </div>
      <span className="text-[10px] font-semibold">{label}</span>
      {isActive && (
        <motion.div 
          layoutId="navDot"
          className="absolute -bottom-1 w-1 h-1 bg-brand-600 rounded-full"
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      )}
    </button>
  );
}
