'use client';
import { User, Mail, Shield, Bell, LogOut, ChevronRight, HelpCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function ProfileView() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto no-scrollbar pb-24">
      <div className="pt-[max(env(safe-area-inset-top),3rem)] px-6 pb-6 bg-white sticky top-0 z-10 border-b border-slate-100">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Profile</h1>
      </div>

      <div className="p-6">
        {/* User Info Card */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-5 mb-8">
          <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-xl font-bold uppercase">
            {user?.displayName ? user.displayName.substring(0, 2) : (user?.email ? user.email.substring(0, 2) : 'U')}
          </div>
          <div className="flex-1 overflow-hidden">
            <h2 className="text-lg font-semibold text-slate-900 truncate">{user?.displayName || 'User'}</h2>
            <p className="text-sm text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Account</h3>
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
              <SettingsRow icon={<User className="w-5 h-5" />} label="Personal Information" />
              <div className="h-px bg-slate-100 ml-12" />
              <SettingsRow icon={<Mail className="w-5 h-5" />} label="Email Preferences" />
              <div className="h-px bg-slate-100 ml-12" />
              <SettingsRow icon={<Shield className="w-5 h-5" />} label="Security & Privacy" />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Preferences</h3>
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
              <SettingsRow icon={<Bell className="w-5 h-5" />} label="Notifications" />
              <div className="h-px bg-slate-100 ml-12" />
              <SettingsRow icon={<HelpCircle className="w-5 h-5" />} label="Help & Support" />
            </div>
          </section>

          <button onClick={signOut} className="w-full flex items-center justify-center gap-2 text-red-500 font-medium py-4 mt-8 hover:bg-red-50 rounded-2xl transition-colors">
             <LogOut className="w-5 h-5" />
             Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="text-slate-400">{icon}</div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </button>
  );
}
