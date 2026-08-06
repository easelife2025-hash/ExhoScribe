'use client';

import { useState, useEffect } from 'react';
import { Notification } from '../types';
import { motion } from 'motion/react';
import { Bell, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { subscribeToNotifications } from '../lib/db';

interface NotificationsViewProps {
  onClose: () => void;
}

export default function NotificationsView({ onClose }: NotificationsViewProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNotifications(user.uid, setNotifications);
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="flex-1 bg-slate-50 flex flex-col h-full absolute inset-0 z-40 overflow-hidden">
      <div className="pt-[max(env(safe-area-inset-top),3rem)] px-6 pb-4 bg-white border-b border-slate-100 flex items-center gap-4 shadow-sm z-10">
        <button onClick={onClose} className="p-2 -ml-2 bg-white rounded-full text-slate-400 hover:text-brand-600 shadow-sm border border-slate-100 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-xl font-semibold text-slate-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-500" /> Notifications
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {notifications.length === 0 ? (
          <div className="text-center mt-12 text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p>You're all caught up!</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className={`p-4 rounded-2xl border transition-colors ${notif.read ? 'bg-white border-slate-100' : 'bg-brand-50 border-brand-200'}`}>
              <h3 className={`font-semibold ${notif.read ? 'text-slate-700' : 'text-brand-900'} mb-1`}>{notif.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-2">{notif.message}</p>
              <div className="text-xs text-slate-400">{new Date(notif.createdAt).toLocaleDateString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
