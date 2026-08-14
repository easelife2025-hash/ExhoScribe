'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Note, Comment, Notification } from '../types';
import { Play, Pause, Bookmark, Download, Sparkles, Target, Edit3, ListTodo, CheckSquare, Search, ChevronLeft, Hash, MessageCircle, Send, Users, Trash2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { saveComment, subscribeToComments, subscribeToNote, updateNote, saveNotification, deleteNote } from '../lib/db';
import { AiChat } from './AiChat';

interface TranscriptViewProps {
  note: Note;
  onBack: () => void;
}

export function TranscriptView({ note: initialNote, onBack }: TranscriptViewProps) {
  const { user } = useAuth();
  const [note, setNote] = useState<Note>(initialNote);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'details' | 'notes' | 'comments' | 'chat'>('summary');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  const [userNotes, setUserNotes] = useState(initialNote.sharedNotes || initialNote.summary || 'Add your shared notes here...');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNote(user.uid, initialNote.id, (updatedNote) => {
      if (updatedNote) {
        setNote(updatedNote);
        if (updatedNote.sharedNotes !== undefined && document.activeElement?.id !== 'shared-notes-input') {
          setUserNotes(updatedNote.sharedNotes);
        }
      }
    });
    return () => unsubscribe();
  }, [user, initialNote.id]);

  useEffect(() => {
    const unsubscribe = subscribeToComments(note.id, setComments);
    return () => unsubscribe();
  }, [note.id]);

  const confirmDelete = async () => {
    if (!user || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteNote(user.uid, note.id);
      onBack();
    } catch (error) {
      console.error("Failed to delete note:", error);
      alert("Failed to delete note.");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setUserNotes(val);
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (user) {
        await updateNote(user.uid, note.id, { sharedNotes: val });
      }
    }, 1000);
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;
    
    // Parse mentions like @example@email.com
    const mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(newComment)) !== null) {
      mentions.push(match[1]);
    }

    const comment: Comment = {
      id: Date.now().toString(),
      noteId: note.id,
      userId: user.uid,
      userName: user.displayName || user.email || 'Unknown',
      text: newComment,
      mentions,
      createdAt: new Date().toISOString(),
    };
    await saveComment(comment);
    
    // Create notifications for mentioned users (simulated by using email as userId for now if actual userId is unknown)
    for (const email of mentions) {
      const title = `${user.displayName || user.email} mentioned you`;
      const message = `In "${note.title}": ${newComment.substring(0, 50)}...`;
      
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        userId: email, // Assuming they might query by email if userId is unknown or we just store it
        title,
        message,
        read: false,
        createdAt: new Date().toISOString(),
      };
      // For a proper system we'd look up the user by email, here we mock saving it with the email as key 
      await saveNotification({ ...notification, userId: email });
      
      // Trigger push notification
      try {
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: email,
            title,
            body: message,
          })
        });
      } catch (err) {
        console.error("Failed to send push notification", err);
      }

      // To see it locally during demo, also notify ourselves if we didn't mention ourselves
      if (email !== user.email) {
         await saveNotification({ ...notification, userId: user.uid, title: `You mentioned ${email}` });
         try {
           await fetch('/api/notifications/send', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               userId: user.uid,
               title: `You mentioned ${email}`,
               body: message,
             })
           });
         } catch (err) {
           console.error("Failed to send push notification to self", err);
         }
      }
    }
    
    setNewComment('');
  };

  const toggleBookmark = (index: number) => {
    const newBookmarks = new Set(bookmarks);
    if (newBookmarks.has(index)) {
      newBookmarks.delete(index);
    } else {
      newBookmarks.add(index);
    }
    setBookmarks(newBookmarks);
  };

  const filteredTranscript = (note.transcript || []).filter(item => 
    item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.speaker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 bg-white flex flex-col h-full absolute inset-0 z-40 overflow-hidden">
      {/* Header */}
      <div className="pt-[max(env(safe-area-inset-top),3rem)] px-6 pb-4 bg-white/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20">
        <button onClick={onBack} className="p-2 -ml-2 bg-white rounded-full text-slate-400 hover:text-brand-600 shadow-[0_2px_8px_rgb(0,0,0,0.04)] active:scale-95 transition-all">
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 shadow-[0_2px_8px_rgb(0,0,0,0.04)] active:scale-95 transition-all disabled:opacity-50"
            title="Delete Note"
          >
            <Trash2 className="w-5 h-5" strokeWidth={2} />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-slate-700 shadow-[0_2px_8px_rgb(0,0,0,0.04)] active:scale-95 transition-all"
            >
              Export
            </button>
            <AnimatePresence>
              {showExportMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-[0_20px_60px_rgb(0,0,0,0.1)] border border-slate-100 overflow-hidden z-50 flex flex-col p-1"
                >
                  <button className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left active:scale-95">
                    <Download className="w-4 h-4 text-slate-400" strokeWidth={2} /> Export PDF
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left active:scale-95">
                    <Download className="w-4 h-4 text-slate-400" strokeWidth={2} /> Export Markdown
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left active:scale-95">
                    <Download className="w-4 h-4 text-slate-400" strokeWidth={2} /> Export JSON
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 flex-1 flex flex-col">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-3">{note.title}</h1>
        <div className="text-sm font-medium text-slate-500 mb-8 flex flex-wrap items-center gap-2">
          <span>{note.date}</span>
          <span>•</span>
          <span>{note.duration}</span>
          {note.sentiment && (
             <>
               <span>•</span>
               <span className="bg-brand-50 text-brand-600 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{note.sentiment}</span>
             </>
          )}
        </div>

        {/* Audio Player Mock */}
        <div className="bg-slate-50 p-4 rounded-[20px] mb-8 flex items-center gap-4 shadow-inner border border-slate-100">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-[0_8px_30px_rgba(79,70,229,0.3)] active:scale-95 transition-all"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" strokeWidth={2} /> : <Play className="w-5 h-5 fill-current ml-0.5" strokeWidth={2} />}
          </button>
          <div className="flex-1">
            <div className="h-2 bg-slate-200 rounded-full w-full overflow-hidden relative">
               <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: isPlaying ? '100%' : '33%' }}
                  transition={{ duration: isPlaying ? 60 : 0.3, ease: "linear" }}
                  className="absolute left-0 top-0 h-full bg-brand-500 rounded-full"
               />
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-500 tabular-nums shrink-0">12:34</div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8 -mx-6 px-6 pb-2">
          <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} icon={Sparkles} label="Summary" />
          <TabButton active={activeTab === 'transcript'} onClick={() => setActiveTab('transcript')} icon={Edit3} label="Transcript" />
          <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')} icon={Target} label="Details" />
          <TabButton active={activeTab === 'comments'} onClick={() => setActiveTab('comments')} icon={MessageCircle} label="Comments" />
          <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={Edit3} label="Shared Notes" />
          <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={Bot} label="AI Chat" />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-safe-bottom">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="pb-10"
            >
              {activeTab === 'summary' && (
                <div className="flex flex-col gap-6">
                  <div className="bg-slate-800 text-white p-6 rounded-[20px] shadow-[0_12px_40px_rgb(0,0,0,0.12)] relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 p-4 opacity-[0.03]">
                      <Sparkles className="w-32 h-32 text-brand-300" />
                    </div>
                    <div className="flex items-center gap-2 mb-4 relative z-10">
                      <Sparkles className="w-5 h-5 text-brand-300" strokeWidth={2} />
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">AI Summary</h3>
                    </div>
                    <p className="text-lg font-medium leading-relaxed relative z-10">{note.summary}</p>
                  </div>
                  {note.actionItems && note.actionItems.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                        <ListTodo className="w-4 h-4" strokeWidth={2} /> Action Items
                      </h3>
                      <ul className="space-y-3">
                        {note.actionItems.map((item, i) => (
                          <li key={i} className="flex gap-3 items-start text-sm bg-white p-4 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <CheckSquare className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" strokeWidth={2} />
                            <span className="flex-1 font-semibold text-slate-900 text-base">{item}</span>
                            <button 
                              onClick={async () => {
                                if (!user) return;
                                const title = 'Task Deadline Reminder';
                                const message = `Reminder for task: "${item}"`;
                                await saveNotification({
                                  id: Date.now().toString() + Math.random().toString(36).substring(2),
                                  userId: user.uid,
                                  title,
                                  message,
                                  read: false,
                                  createdAt: new Date().toISOString()
                                });
                                try {
                                  await fetch('/api/notifications/send', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ userId: user.uid, title, body: message })
                                  });
                                } catch (e) {}
                                alert("Reminder set!");
                              }}
                              className="text-xs text-brand-600 font-medium hover:underline shrink-0"
                            >
                              Remind Me
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {note.chapters && note.chapters.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                        <ListTodo className="w-4 h-4" strokeWidth={2} /> Chapters
                      </h3>
                      <div className="flex flex-col gap-3">
                        {note.chapters.map((chapter, i) => (
                          <div key={i} className="flex gap-4 p-4 bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)] rounded-[20px] items-start">
                            <span className="text-sm font-bold text-brand-600 shrink-0 w-12 pt-0.5">{chapter.time}</span>
                            <div>
                               <h4 className="text-base font-semibold text-slate-900 mb-1">{chapter.title}</h4>
                               <p className="text-sm font-medium text-slate-600 leading-relaxed">{chapter.summary}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'transcript' && (
                <div className="flex flex-col gap-6">
                  <div className="relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={2} />
                    <input 
                      type="text" 
                      placeholder="Search in transcript..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 shadow-inner rounded-[16px] pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow font-medium text-slate-900"
                    />
                  </div>
                  <div className="space-y-6">
                    {filteredTranscript.map((item, index) => (
                      <div key={index} className="flex gap-4 group">
                        <div className="w-12 text-xs font-bold text-brand-600 pt-0.5 shrink-0 tabular-nums">
                          {item.time}
                        </div>
                        <div className="flex-1 relative">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-semibold text-slate-900">{item.speaker}</div>
                            <button 
                              onClick={() => toggleBookmark(index)}
                              className={`p-1.5 rounded-lg transition-all active:scale-95 ${bookmarks.has(index) ? 'text-amber-500 bg-amber-50 shadow-sm' : 'text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-slate-100'}`}
                            >
                              <Bookmark className="w-4 h-4" fill={bookmarks.has(index) ? "currentColor" : "none"} strokeWidth={2} />
                            </button>
                          </div>
                          <div className={`text-base leading-relaxed transition-colors ${bookmarks.has(index) ? 'text-slate-900 font-semibold bg-amber-50/50 p-2 -mx-2 rounded-lg' : 'text-slate-600 group-hover:text-slate-800'}`}>
                            {item.text}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {filteredTranscript.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-sm font-medium bg-slate-50 rounded-[20px]">
                      No matching transcript found.
                    </div>
                  )}
                </div>
              )}
               {activeTab === 'details' && (
                <div className="flex flex-col gap-8">
                   {note.decisions && note.decisions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                        <Target className="w-4 h-4 text-amber-500" strokeWidth={2} /> Decisions Made
                      </h3>
                      <ul className="list-disc pl-5 space-y-2 text-base font-medium text-slate-800">
                        {note.decisions.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                   )}
                   {note.tasks && note.tasks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                        <ListTodo className="w-4 h-4 text-brand-500" strokeWidth={2} /> Tasks Identified
                      </h3>
                      <ul className="list-disc pl-5 space-y-2 text-base font-medium text-slate-800">
                        {note.tasks.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                   )}
                   {(note.keywords && note.keywords.length > 0) || (note.tags && note.tags.length > 0) ? (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                        <Hash className="w-4 h-4" strokeWidth={2} /> Keywords & Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set([...(note.keywords || []), ...(note.tags || [])])).map((kw, i) => (
                          <span key={i} className="px-3.5 py-1.5 bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)] text-slate-700 text-xs font-bold tracking-wide rounded-full">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                   ) : null}
                </div>
              )}
              
              {activeTab === 'comments' && (
                <div className="flex flex-col gap-4 h-full">
                  <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4">
                    {comments.map((comment, i) => (
                      <div key={i} className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 rounded-[20px]">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-slate-900">{comment.userName}</span>
                          <span className="text-xs font-semibold text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 leading-relaxed">{comment.text}</p>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div className="text-center p-10 bg-slate-50 rounded-[24px]">
                        <p className="text-sm font-medium text-slate-500">No comments yet. Start the conversation!</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative mt-auto">
                    <input 
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      placeholder="Add a comment... (use @ to mention)"
                      className="w-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[20px] pl-5 pr-14 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium text-slate-900"
                    />
                    <button 
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-colors shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="flex flex-col gap-4 h-full">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    <Edit3 className="w-4 h-4 text-brand-500" strokeWidth={2} /> Shared Notes
                  </div>
                  <textarea
                    id="shared-notes-input"
                    value={userNotes}
                    onChange={handleNotesChange}
                    className="w-full flex-1 min-h-[300px] bg-slate-50 shadow-inner rounded-[20px] p-5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none"
                    placeholder="Type your notes here..."
                  />
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="h-[70vh] min-h-[500px] -mx-6 -mb-10 border-t border-slate-100 flex flex-col relative">
                  <AiChat note={note} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Note</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Are you sure you want to delete this note? This action cannot be undone.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 px-4 bg-red-500 text-white rounded-xl font-medium text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all shrink-0 ${active ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} /> {label}
    </button>
  );
}
