'use client';

import { ViewState } from '../types';
import { Home, Mic, User, Settings, Folder, Calendar, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onStartRecording: () => void;
}

export default function BottomNav({ currentView, onChangeView, onStartRecording }: BottomNavProps) {
  // Hide nav during recording or transcript view
  if (currentView === 'recording' || currentView === 'transcript' || currentView === 'search') return null;

  return (
    <div className="absolute bottom-0 inset-x-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 pb-[env(safe-area-inset-bottom)] z-40">
      <div className="flex items-center justify-around h-20 px-4">
        <button 
          onClick={() => onChangeView('home')}
          className={`flex flex-col items-center justify-center w-16 gap-1 ${currentView === 'home' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Home className="w-6 h-6" strokeWidth={currentView === 'home' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        
        <button 
          onClick={() => onChangeView('calendar')}
          className={`flex flex-col items-center justify-center w-16 gap-1 ${currentView === 'calendar' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Calendar className="w-6 h-6" strokeWidth={currentView === 'calendar' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Calendar</span>
        </button>

        {/* FAB Style Record Button */}
        <div className="relative -top-5">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartRecording}
            className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-brand-500/30 border-4 border-white"
          >
            <Mic className="w-7 h-7" strokeWidth={2.5} />
          </motion.button>
        </div>

        <button 
          onClick={() => onChangeView('workspaces')}
          className={`flex flex-col items-center justify-center w-16 gap-1 ${currentView === 'workspaces' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Users className="w-6 h-6" strokeWidth={currentView === 'workspaces' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Teams</span>
        </button>

        <button 
          onClick={() => onChangeView('profile')}
          className={`flex flex-col items-center justify-center w-16 gap-1 ${currentView === 'profile' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <User className="w-6 h-6" strokeWidth={currentView === 'profile' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
}
