'use client';
import { Note } from '../types';
import { Search, Bell, Calendar, Clock, ChevronRight, Sparkles, Pin, Mic, Upload, PenLine, BarChart3, Filter, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { useState } from 'react';
import { deleteNote } from '../lib/db';

interface HomeViewProps {
  notes: Note[];
  onOpenNote: (note: Note) => void;
  onOpenUpload: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  uploadTasks: import('../types').UploadTask[];
}

export default function HomeView({ notes, onOpenNote, onOpenUpload, onOpenSearch, onOpenNotifications, uploadTasks }: HomeViewProps) {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] || 'there';
  const [activeFilter, setActiveFilter] = useState('All');

  const handleDelete = async (noteId: string) => {
    if (!user) return;
    if (window.confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
      try {
        await deleteNote(user.uid, noteId);
      } catch (error) {
        console.error("Failed to delete note:", error);
        alert("Failed to delete note.");
      }
    }
  };

  const filters = ['All', 'Work', 'Personal', 'Shared', 'Pinned'];

  const filteredNotes = notes.filter(n => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Pinned') return n.isPinned;
    if (activeFilter === 'Work' || activeFilter === 'Personal' || activeFilter === 'Shared') {
      return n.tags?.includes(activeFilter);
    }
    return true;
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const todayNotes = filteredNotes.filter(n => n.isToday);
  const recentNotes = filteredNotes.filter(n => !n.isToday && !n.isPinned);
  const activeUploads = uploadTasks.filter(t => t.status === 'uploading' || t.status === 'processing');

  return (
    <div className="flex-1 overflow-y-auto pb-safe-bottom pb-24 no-scrollbar bg-slate-50">
      {/* Header & Search */}
      <div className="pt-[max(env(safe-area-inset-top),3rem)] px-6 pb-4 bg-slate-50/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Good Morning, {firstName}</h1>
          <div className="flex items-center gap-3">
            <button onClick={onOpenNotifications} className="relative p-2 text-slate-400 hover:text-brand-600 transition-colors">
              <Bell className="w-6 h-6" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-50"></div>
            </button>
            <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-semibold uppercase text-sm">
            {user?.displayName ? user.displayName.substring(0, 2) : 'US'}</div>
          </div>
        </div>
        
        {activeUploads.length > 0 && (
          <button onClick={onOpenUpload} className="w-full bg-brand-50 rounded-[20px] p-4 mb-4 flex items-center justify-between border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-[0.98] transition-all">
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold text-brand-900">Uploading {activeUploads.length} {activeUploads.length === 1 ? 'file' : 'files'}...</span>
              <span className="text-xs text-brand-600 font-medium mt-0.5">Tap to view progress</span>
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
          </button>
        )}
        
        {/* Search */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onOpenSearch} className="relative flex-1 text-left group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-brand-500 transition-colors" />
            <div className="w-full bg-white shadow-[0_2px_12px_rgb(0,0,0,0.04)] rounded-xl py-3.5 pl-12 pr-4 text-sm text-slate-400 font-medium">
              Search your notes...
            </div>
          </button>
          <button onClick={onOpenSearch} className="w-[52px] h-[52px] bg-white shadow-[0_2px_12px_rgb(0,0,0,0.04)] rounded-xl flex items-center justify-center text-slate-500 hover:text-brand-600 active:scale-95 transition-all">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap active:scale-95 transition-all ${
                activeFilter === filter 
                  ? 'bg-slate-800 text-white shadow-[0_4px_12px_rgb(0,0,0,0.1)]' 
                  : 'bg-white text-slate-600 shadow-[0_2px_8px_rgb(0,0,0,0.04)]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6 flex flex-col gap-8">
        
        {/* Quick Actions */}
        <section>
          <div className="grid grid-cols-3 gap-3">
             <button className="flex flex-col items-center justify-center gap-3 p-5 bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95 transition-all">
               <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                 <Mic className="w-6 h-6" />
               </div>
               <span className="text-sm font-medium text-slate-700">Record</span>
             </button>
             <button onClick={onOpenUpload} className="flex flex-col items-center justify-center gap-3 p-5 bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95 transition-all">
               <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                 <Upload className="w-6 h-6" />
               </div>
               <span className="text-sm font-medium text-slate-700">Import</span>
             </button>
             <button className="flex flex-col items-center justify-center gap-3 p-5 bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95 transition-all">
               <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                 <PenLine className="w-6 h-6" />
               </div>
               <span className="text-sm font-medium text-slate-700">Write</span>
             </button>
          </div>
        </section>

        {/* Usage Stats */}
        <section className="bg-slate-800 rounded-[20px] p-6 text-white shadow-[0_12px_40px_rgb(0,0,0,0.12)] relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-300" />
              <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">This Week</span>
            </div>
            <span className="text-xs font-medium bg-white/10 px-3 py-1.5 rounded-full">Pro Plan</span>
          </div>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div>
              <div className="text-3xl font-semibold tracking-tight mb-1">12.5<span className="text-base font-normal text-slate-400"> hrs</span></div>
              <div className="text-sm font-medium text-slate-400">Time Saved</div>
            </div>
            <div>
              <div className="text-3xl font-semibold tracking-tight mb-1">8<span className="text-base font-normal text-slate-400"> notes</span></div>
              <div className="text-sm font-medium text-slate-400">Transcribed</div>
            </div>
          </div>
        </section>

        {/* AI Summaries & Pinned */}
        {pinnedNotes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Pin className="w-4 h-4" /> Pinned Highlights
              </h2>
            </div>
            <div className="flex overflow-x-auto no-scrollbar -mx-6 px-6 gap-4 pb-4">
              {pinnedNotes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => onOpenNote(note)}
                  role="button"
                  tabIndex={0}
                  className="shrink-0 w-[280px] bg-white p-6 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="absolute top-0 right-0 p-4 flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                      className="relative z-20 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] pointer-events-none">
                    <Sparkles className="w-32 h-32 text-brand-600" />
                  </div>
                  <div className="flex items-center gap-2 mb-4 relative z-10">
                    <Sparkles className="w-4 h-4 text-brand-500" />
                    <h3 className="text-xs font-semibold text-brand-600 uppercase tracking-wider">AI Insight</h3>
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-3 truncate relative z-10 pr-8">{note.title}</h4>
                  <div className="space-y-3 relative z-10">
                     {(note.aiHighlights || note.actionItems || note.decisions || [note.summary]).slice(0, 2).map((highlight, idx) => (
                       <p key={idx} className="text-sm text-slate-600 leading-relaxed pl-3 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:bg-brand-500 before:rounded-full line-clamp-2">
                         {highlight}
                       </p>
                     ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Today's Meetings */}
        {todayNotes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Today</h2>
            </div>
            <div className="flex flex-col gap-4">
              {todayNotes.map((note, index) => (
                <NoteCard key={note.id} note={note} onClick={() => onOpenNote(note)} index={index} onDelete={(e) => { e.stopPropagation(); handleDelete(note.id); }} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Notes */}
        {recentNotes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Previous</h2>
              <button className="text-sm font-medium text-brand-600 hover:text-brand-700 active:opacity-70 transition-opacity">See all</button>
            </div>
            <div className="flex flex-col gap-4">
              {recentNotes.map((note, index) => (
                <NoteCard key={note.id} note={note} onClick={() => onOpenNote(note)} index={index} onDelete={(e) => { e.stopPropagation(); handleDelete(note.id); }} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function NoteCard({ note, onClick, index, onDelete }: { note: Note; onClick: () => void; index: number; onDelete?: (e: React.MouseEvent) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="bg-white p-5 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left w-full active:scale-[0.98] transition-all flex flex-col gap-3 group cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <h3 className="text-base font-semibold text-slate-900 leading-tight pr-4">{note.title}</h3>
        <div className="flex items-center gap-1 shrink-0">
          {onDelete && (
            <button 
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
              title="Delete Note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <div className="p-1.5 group-hover:translate-x-1 transition-transform">
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
      
      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{note.summary}</p>
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{note.date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{note.duration}</span>
          </div>
        </div>
        
        {note.tags && note.tags.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium tracking-wide truncate max-w-[80px]">
              {note.tags[0]}
            </span>
            {note.tags.length > 1 && (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium tracking-wide">
                +{note.tags.length - 1}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
