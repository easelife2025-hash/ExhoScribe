'use client';
import { useState } from 'react';
import { User, Mail, Shield, Bell, LogOut, ChevronRight, HelpCircle, Brain, Globe, Settings as SettingsIcon, Link as LinkIcon, Database, CreditCard, Trash2, ChevronLeft, Check, AlertTriangle, Play, CheckCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function ProfileView() {
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    { id: 'profile', title: 'Profile Management', icon: <User className="w-5 h-5" /> },
    { id: 'ai', title: 'AI Preferences', icon: <Brain className="w-5 h-5" /> },
    { id: 'language', title: 'Language & Region', icon: <Globe className="w-5 h-5" /> },
    { id: 'transcription', title: 'Transcription Quality', icon: <SettingsIcon className="w-5 h-5" /> },
    { id: 'notifications', title: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'integrations', title: 'Integrations', icon: <LinkIcon className="w-5 h-5" /> },
    { id: 'privacy', title: 'Privacy Controls', icon: <Shield className="w-5 h-5" /> },
    { id: 'storage', title: 'Storage Usage', icon: <Database className="w-5 h-5" /> },
    { id: 'subscription', title: 'Subscription', icon: <CreditCard className="w-5 h-5" /> },
  ];

  if (activeSection) {
    return (
      <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
        <div className="pt-[max(env(safe-area-inset-top),1rem)] px-4 pb-4 bg-white sticky top-0 z-10 border-b border-slate-100 flex items-center gap-3">
          <button onClick={() => setActiveSection(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h2 className="font-semibold text-lg text-slate-900">
            {sections.find(s => s.id === activeSection)?.title || 'Settings'}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
          {activeSection === 'profile' && <ProfileManagement user={user} />}
          {activeSection === 'ai' && <AIPreferences />}
          {activeSection === 'language' && <LanguageSelection />}
          {activeSection === 'transcription' && <TranscriptionQuality />}
          {activeSection === 'notifications' && <NotificationPreferences />}
          {activeSection === 'integrations' && <Integrations />}
          {activeSection === 'privacy' && <PrivacyControls />}
          {activeSection === 'storage' && <StorageUsage />}
          {activeSection === 'subscription' && <SubscriptionPage />}
        </div>
      </div>
    );
  }

    return (
      <div className="flex-1 bg-slate-50 overflow-y-auto no-scrollbar pb-safe-bottom pb-24">
        <div className="pt-[max(env(safe-area-inset-top),3rem)] px-6 pb-6 bg-slate-50/80 backdrop-blur-xl sticky top-0 z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Settings</h1>
        </div>
  
        <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
          {/* User Info Card */}
          <div className="bg-white p-6 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-5">
            <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-xl font-bold uppercase">
              {user?.displayName ? user.displayName.substring(0, 2) : (user?.email ? user.email.substring(0, 2) : 'U')}
            </div>
            <div className="flex-1 overflow-hidden">
              <h2 className="text-lg font-semibold text-slate-900 truncate">{user?.displayName || 'User'}</h2>
              <p className="text-sm text-slate-500 truncate">{user?.email}</p>
            </div>
            <button onClick={() => setActiveSection('profile')} className="px-4 py-2 bg-slate-100 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-200 transition-colors active:scale-95">
              Edit
            </button>
          </div>
  
          {/* Settings Sections */}
          <div className="space-y-6">
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Account & Preferences</h3>
              <div className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                {sections.slice(0, 5).map((section, idx) => (
                  <div key={section.id}>
                    <SettingsRow 
                      icon={section.icon} 
                      label={section.title} 
                      onClick={() => setActiveSection(section.id)}
                    />
                    {idx < 4 && <div className="h-px bg-slate-50 ml-12" />}
                  </div>
                ))}
              </div>
            </section>
  
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Data & Privacy</h3>
              <div className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                {sections.slice(5, 8).map((section, idx) => (
                  <div key={section.id}>
                    <SettingsRow 
                      icon={section.icon} 
                      label={section.title} 
                      onClick={() => setActiveSection(section.id)}
                    />
                    {idx < 2 && <div className="h-px bg-slate-50 ml-12" />}
                  </div>
                ))}
              </div>
            </section>
            
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Billing</h3>
              <div className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <SettingsRow 
                  icon={sections[8].icon} 
                  label={sections[8].title} 
                  onClick={() => setActiveSection(sections[8].id)}
                />
              </div>
            </section>
  
            <section className="pt-2">
              <div className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                 <button onClick={signOut} className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors active:bg-red-100">
                    <div className="flex items-center gap-3 text-red-500">
                      <LogOut className="w-5 h-5" strokeWidth={2} />
                      <span className="text-sm font-medium">Log Out</span>
                    </div>
                 </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
}

function SettingsRow({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left active:bg-slate-100">
      <div className="flex items-center gap-3">
        <div className="text-slate-400">{icon}</div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300" strokeWidth={2} />
    </button>
  );
}

// Sub-components

function ProfileManagement({ user }: { user: any }) {
  const [name, setName] = useState(user?.displayName || '');
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="bg-white p-6 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full shadow-[0_2px_8px_rgb(0,0,0,0.04)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow bg-slate-50/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
          <input type="email" value={user?.email || ''} disabled className="w-full rounded-xl px-4 py-3 bg-slate-100 text-slate-500" />
        </div>
        <button className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium shadow-[0_8px_30px_rgba(79,70,229,0.3)] active:scale-95 transition-all mt-4">Save Changes</button>
      </div>
      <div className="bg-red-50 p-6 rounded-[20px] border border-red-100 space-y-4">
        <h3 className="text-red-800 font-medium flex items-center gap-2"><AlertTriangle className="w-5 h-5" strokeWidth={2} /> Danger Zone</h3>
        <p className="text-sm text-red-600/80">Permanently delete your account and all associated data. This action cannot be undone.</p>
        <button className="px-4 py-3 bg-red-100 text-red-700 rounded-xl font-medium active:scale-95 transition-all flex items-center justify-center w-full gap-2">
          <Trash2 className="w-4 h-4" strokeWidth={2} /> Delete Account
        </button>
      </div>
    </div>
  );
}

function AIPreferences() {
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Default Summary Style</label>
          <p className="text-xs text-slate-500 mb-3">Choose how AI generates meeting summaries by default.</p>
          <select className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
            <option>Bullet Points</option>
            <option>Detailed Paragraphs</option>
            <option>Executive Overview</option>
          </select>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            <div className="text-sm font-medium text-slate-900">Auto-Extract Action Items</div>
            <div className="text-xs text-slate-500">Automatically identify tasks and deadlines.</div>
          </div>
          <Toggle defaultChecked />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            <div className="text-sm font-medium text-slate-900">Sentiment Analysis</div>
            <div className="text-xs text-slate-500">Detect overall tone of conversations.</div>
          </div>
          <Toggle defaultChecked />
        </div>
      </div>
    </div>
  );
}

function LanguageSelection() {
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">UI Language</label>
          <select className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
            <option>English (US)</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Default Spoken Language</label>
          <p className="text-xs text-slate-500 mb-3">The primary language for transcription.</p>
          <select className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
            <option>Mandarin</option>
            <option>Japanese</option>
          </select>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            <div className="text-sm font-medium text-slate-900">Auto-Detect Language</div>
            <div className="text-xs text-slate-500">Attempt to detect spoken language automatically.</div>
          </div>
          <Toggle defaultChecked={false} />
        </div>
      </div>
    </div>
  );
}

function TranscriptionQuality() {
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="p-4 border-2 border-brand-500 bg-brand-50 rounded-xl flex items-start gap-3 cursor-pointer">
          <div className="mt-1 text-brand-600"><CheckCircle className="w-5 h-5" /></div>
          <div>
            <div className="font-semibold text-brand-900">High Accuracy (Pro)</div>
            <div className="text-sm text-brand-700/80 mt-1">Uses advanced models for near-perfect transcription. Best for noisy environments or multiple speakers.</div>
          </div>
        </div>
        <div className="p-4 border border-slate-200 rounded-xl flex items-start gap-3 cursor-pointer hover:border-slate-300">
          <div className="mt-1 w-5 h-5 rounded-full border-2 border-slate-300" />
          <div>
            <div className="font-semibold text-slate-900">Standard</div>
            <div className="text-sm text-slate-500 mt-1">Faster processing times. Good for clear audio with a single speaker.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationPreferences() {
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-sm font-semibold text-slate-900">Push Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-700">Recording Completed</div>
            <Toggle defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-700">AI Processing Finished</div>
            <Toggle defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-700">New Comments & Mentions</div>
            <Toggle defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-700">Upcoming Meeting Reminders</div>
            <Toggle defaultChecked />
          </div>
        </div>
        
        <div className="h-px bg-slate-100" />
        
        <h3 className="text-sm font-semibold text-slate-900">Email Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-700">Weekly Summary</div>
            <Toggle defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-700">Workspace Invitations</div>
            <Toggle defaultChecked />
          </div>
        </div>
      </div>
    </div>
  );
}

function Integrations() {
  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {[
        { name: 'Google Calendar', desc: 'Sync upcoming meetings and join links.', connected: true },
        { name: 'Microsoft Outlook', desc: 'Sync Outlook events and contacts.', connected: false },
        { name: 'Zoom', desc: 'Automatically import cloud recordings.', connected: false },
        { name: 'Slack', desc: 'Share meeting summaries to channels.', connected: false },
      ].map((int, i) => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="font-medium text-slate-900">{int.name}</div>
            <div className="text-sm text-slate-500 mt-0.5">{int.desc}</div>
          </div>
          <button className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${int.connected ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-brand-50 text-brand-600 hover:bg-brand-100'}`}>
            {int.connected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      ))}
    </div>
  );
}

function PrivacyControls() {
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900">Allow AI Training</div>
            <div className="text-xs text-slate-500 mt-1 max-w-[250px]">Allow your anonymized data to be used to improve AI models.</div>
          </div>
          <Toggle defaultChecked={false} />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            <div className="text-sm font-medium text-slate-900">Share Analytics</div>
            <div className="text-xs text-slate-500 mt-1 max-w-[250px]">Send anonymous usage data to help us improve the app.</div>
          </div>
          <Toggle defaultChecked />
        </div>
      </div>
    </div>
  );
}

function StorageUsage() {
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="text-3xl font-display font-semibold text-slate-900">2.4 GB</div>
            <div className="text-sm text-slate-500">used of 5 GB</div>
          </div>
          <div className="text-sm font-medium text-brand-600">48% Full</div>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-brand-500 rounded-full" style={{ width: '48%' }} />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-brand-500" /> Audio Files</div>
            <div className="text-slate-600">1.8 GB</div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500" /> Transcripts</div>
            <div className="text-slate-600">400 MB</div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Attachments</div>
            <div className="text-slate-600">200 MB</div>
          </div>
        </div>
        
        <button className="w-full mt-8 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors">
          Manage Storage
        </button>
      </div>
    </div>
  );
}

function SubscriptionPage() {
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-6 rounded-2xl shadow-md text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-brand-100 text-sm font-medium mb-1">Current Plan</div>
            <div className="text-2xl font-display font-semibold">Pro Tier</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold">$12.99</div>
            <div className="text-brand-200 text-xs">per month</div>
          </div>
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-brand-50"><Check className="w-4 h-4 text-brand-300" /> Unlimited transcriptions</div>
          <div className="flex items-center gap-2 text-sm text-brand-50"><Check className="w-4 h-4 text-brand-300" /> High-accuracy AI model</div>
          <div className="flex items-center gap-2 text-sm text-brand-50"><Check className="w-4 h-4 text-brand-300" /> Workspace collaboration</div>
          <div className="flex items-center gap-2 text-sm text-brand-50"><Check className="w-4 h-4 text-brand-300" /> 50GB Cloud Storage</div>
        </div>
        <div className="flex gap-3">
           <button className="flex-1 py-2.5 bg-white text-brand-700 rounded-xl font-medium hover:bg-brand-50 transition-colors">Manage Billing</button>
           <button className="px-4 py-2.5 bg-brand-700/50 text-white rounded-xl font-medium hover:bg-brand-700/70 transition-colors">Cancel Plan</button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <button 
      onClick={() => setChecked(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-brand-500' : 'bg-slate-200'}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

