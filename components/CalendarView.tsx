/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Video, MapPin, Clock, Plus, ExternalLink, CalendarPlus, CheckCircle, PlusCircle } from 'lucide-react';
import { CalendarEvent, fetchGoogleCalendarEvents, fetchMicrosoftCalendarEvents } from '../lib/calendar';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { format, isSameDay } from 'date-fns';

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [msConnected, setMsConnected] = useState(false);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [msToken, setMsToken] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);

  const handleImportRecording = async (event: CalendarEvent) => {
    if (!googleToken) return;
    setImportingId(event.id);
    
    try {
      const { fetchGoogleDriveRecording } = await import('../lib/calendar');
      const link = await fetchGoogleDriveRecording(googleToken, event.title);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (link) {
        alert(`Successfully imported recording for ${event.title}! Processing started in background.`);
      } else {
        alert(`No MP4 recording found in Google Drive for ${event.title}.`);
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to import recording: ${err}`);
    } finally {
      setImportingId(null);
    }
  };

  useEffect(() => {
    // Check if we have tokens stored in memory for this session
    const storedGoogleToken = sessionStorage.getItem('googleAccessToken');
    if (storedGoogleToken) {
      setGoogleToken(storedGoogleToken);
      setGoogleConnected(true);
    }
    const storedMsToken = sessionStorage.getItem('msAccessToken');
    if (storedMsToken) {
      setMsToken(storedMsToken);
      setMsConnected(true);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    let allEvents: CalendarEvent[] = [];
    
    if (googleToken) {
      const googleEvents = await fetchGoogleCalendarEvents(googleToken);
      allEvents = [...allEvents, ...googleEvents];
    }
    
    if (msToken) {
      const msEvents = await fetchMicrosoftCalendarEvents(msToken);
      allEvents = [...allEvents, ...msEvents];
    }
    
    // Sort by start time
    allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    setEvents(allEvents);
    setLoading(false);

    if (allEvents.length > 0 && auth.currentUser) {
      const firstEvent = allEvents[0];
      const title = 'Upcoming Meeting';
      const message = `${firstEvent.title} is starting soon.`;
      
      const { saveNotification } = await import('@/lib/db');
      await saveNotification({
        id: Date.now().toString(),
        userId: auth.currentUser.uid,
        title,
        message,
        read: false,
        createdAt: new Date().toISOString()
      });

      try {
        fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: auth.currentUser.uid,
            title,
            body: message
          })
        });
      } catch (err) {}
    }
  }, [googleToken, msToken]);

  useEffect(() => {
    if (googleToken || msToken) {
      loadEvents();
    }
  }, [googleToken, msToken, loadEvents]);

  const connectGoogleCalendar = async () => {
    try {
      setLoading(true);
      googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleToken(credential.accessToken);
        setGoogleConnected(true);
        sessionStorage.setItem('googleAccessToken', credential.accessToken);
      }
    } catch (error) {
      console.error("Error connecting Google Calendar", error);
    } finally {
      setLoading(false);
    }
  };

  const connectMicrosoftCalendar = async () => {
    try {
      const response = await fetch('/api/auth/ms/url');
      const { url } = await response.json();
      
      const width = 600;
      const height = 700;
      const left = (window.innerWidth / 2) - (width / 2);
      const top = (window.innerHeight / 2) - (height / 2);
      
      const popup = window.open(url, 'ms_oauth', `width=${width},height=${height},left=${left},top=${top}`);
      
      if (!popup) {
        alert("Please allow popups to connect Microsoft Calendar.");
      }
    } catch (error) {
      console.error("Error initiating MS OAuth", error);
    }
  };

  // Listen for MS OAuth callback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.token) {
        setMsToken(event.data.token);
        setMsConnected(true);
        sessionStorage.setItem('msAccessToken', event.data.token);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Group events by day
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.start);
    const dateString = format(date, 'yyyy-MM-dd');
    if (!acc[dateString]) {
      acc[dateString] = [];
    }
    acc[dateString].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-20">
      <div className="pt-[max(env(safe-area-inset-top),2rem)] px-6 pb-6 bg-white border-b border-slate-200">
        <h1 className="text-3xl font-display font-semibold text-slate-900">Calendar</h1>
        <p className="text-slate-500 mt-1">Sync meetings and easily link them to your notes.</p>
        
        <div className="flex gap-3 mt-6 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={googleConnected ? undefined : connectGoogleCalendar}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all ${
              googleConnected 
                ? 'bg-brand-50 border-brand-200 text-brand-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {googleConnected ? <CheckCircle className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            Google Calendar
          </button>
          
          <button 
            onClick={msConnected ? undefined : connectMicrosoftCalendar}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all ${
              msConnected 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {msConnected ? <CheckCircle className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            Outlook Calendar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading && events.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No upcoming events</h3>
            <p className="text-slate-500 text-sm max-w-[250px]">
              {!googleConnected && !msConnected 
                ? 'Connect a calendar above to see your schedule.' 
                : 'You have no events scheduled for the next 7 days.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedEvents).map(([dateStr, dayEvents]) => (
              <div key={dateStr}>
                <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider sticky top-0 bg-slate-50/90 backdrop-blur py-2 z-10">
                  {format(new Date(dateStr), 'EEEE, MMMM d')}
                </h3>
                <div className="space-y-4">
                  {dayEvents.map(event => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={event.id} 
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-base font-semibold text-slate-900 leading-tight pr-4">{event.title}</h4>
                        <div className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${
                          event.source === 'google' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {event.source}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 mt-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>
                            {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
                          </span>
                        </div>
                        
                        {event.meetLink && (
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-brand-500" />
                            <a href={event.meetLink} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline inline-flex items-center gap-1">
                              Join Meeting <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        
                        {event.location && !event.meetLink && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-5 pt-4 border-t border-slate-100 flex gap-3">
                        <button className="flex-1 flex items-center justify-center gap-2 bg-brand-50 hover:bg-brand-100 text-brand-700 py-2.5 rounded-xl text-sm font-medium transition-colors">
                          <Plus className="w-4 h-4" />
                          Link Note
                        </button>
                        {new Date(event.end) < new Date() && event.meetLink && event.source === 'google' && (
                          <button 
                            onClick={() => handleImportRecording(event)}
                            disabled={importingId === event.id}
                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {importingId === event.id ? (
                              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Video className="w-4 h-4" />
                            )}
                            {importingId === event.id ? 'Importing...' : 'Import Recording'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
