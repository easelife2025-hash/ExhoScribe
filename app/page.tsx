'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import BottomNav from '@/components/BottomNav';
import HomeView from '@/components/HomeView';
import RecordingView from '@/components/RecordingView';
import TranscriptView from '@/components/TranscriptView';
import ProfileView from '@/components/ProfileView';
import AuthView from '@/components/AuthView';
import UploadView from '@/components/UploadView';
import CalendarView from '@/components/CalendarView';
import WorkspacesView from "@/components/WorkspacesView";
import NotificationsView from "@/components/NotificationsView";
import SearchView from '@/components/SearchView';
import { ViewState, Note, UploadTask } from '@/types';
import { AnimatePresence, motion } from 'motion/react';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const uploadTasksRef = useRef(uploadTasks);
  
  useEffect(() => {
    uploadTasksRef.current = uploadTasks;
  }, [uploadTasks]);

  useEffect(() => {
    if (user) {
      import('@/lib/db').then(({ fetchNotes }) => {
        fetchNotes(user.uid).then(fetchedNotes => {
          setNotes(fetchedNotes);
        }).catch(err => console.error("Error fetching notes:", err));
      });
    }
  }, [user]);

  const handleOpenNote = (note: Note) => {
    setActiveNote(note);
    setCurrentView('transcript');
  };

  const handleBackToHome = () => {
    setActiveNote(null);
    setCurrentView('home');
  };

  const handleSaveRecording = async (file: File) => {
    addUploadTasks([file]);
    setCurrentView('upload');
  };

  const processUpload = useCallback(async (taskId: string, file: File, currentUser: any) => {
    try {
      setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 5, status: 'uploading' } : t));

      // 1. Upload to Firebase Storage
      const { storage } = await import('@/lib/firebase');
      const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
      
      const safeName = file.name ? file.name.replace(/[^a-zA-Z0-9.]/g, '') : 'upload.mp4';
      const storageRef = ref(storage, `uploads/${currentUser.uid}/${Date.now()}_${safeName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      const downloadUrl = await new Promise<string>((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = 5 + (snapshot.bytesTransferred / snapshot.totalBytes) * 45;
            setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress, status: 'uploading' } : t));
          }, 
          (error) => {
            reject(error);
          }, 
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 50, status: 'processing' } : t));

      // 2. Send URL to API to process
      const response = await fetch('/api/process-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: downloadUrl,
          fileName: file.name,
          mimeType: file.type,
          model: 'gemini-3.6-flash'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process media');
      }

      setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 80 } : t));

      const aiResult = await response.json();

      const newNote: Note = {
        id: Date.now().toString() + Math.random().toString(36).substring(2),
        title: file.name,
        date: new Date().toLocaleString(),
        duration: aiResult.duration || 'Unknown',
        summary: aiResult.summary || 'Summary generated from uploaded media.',
        tags: aiResult.keywords || ['Upload'],
        transcript: aiResult.transcript || [],
        chapters: aiResult.chapters || [],
        actionItems: aiResult.actionItems || [],
        decisions: aiResult.decisions || [],
        tasks: aiResult.tasks || [],
        sentiment: aiResult.sentiment || 'Neutral',
      };

      const { saveNote, saveNotification } = await import('@/lib/db');
      await saveNote(currentUser.uid, newNote);
      setNotes(prev => [newNote, ...prev]);

      setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 100, status: 'completed' } : t));

      // Trigger notification for processing completion
      const title = 'Processing Complete';
      const message = `Finished processing "${newNote.title}"`;
      const notif = {
        id: Date.now().toString(),
        userId: currentUser.uid,
        title,
        message,
        read: false,
        createdAt: new Date().toISOString()
      };
      await saveNotification(notif);
      
      try {
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.uid,
            title,
            body: message
          })
        });
      } catch(e) {}

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'failed', error: error.message || 'Upload failed' } : t));
    }
  }, []);

  const addUploadTasks = useCallback((files: File[]) => {
    const newTasks: UploadTask[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'pending',
    }));
    
    setUploadTasks(prev => [...newTasks, ...prev]);
    
    newTasks.forEach(task => {
      processUpload(task.id, task.file, user);
    });
  }, [processUpload, user]);

  const removeUploadTask = useCallback((taskId: string) => {
    setUploadTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const retryUploadTask = useCallback((taskId: string) => {
    setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'uploading', progress: 0, error: undefined } : t));
    const task = uploadTasksRef.current.find(t => t.id === taskId);
    if (task) {
      processUpload(taskId, task.file, user);
    }
  }, [processUpload, user]);

  if (loading) {
    return <div className="flex-1 w-full h-[100dvh] bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
    </div>;
  }

  if (!user) {
    return <AuthView onAuthSuccess={() => setCurrentView('home')} />;
  }

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden flex flex-col bg-slate-50">
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col"
            >
              <HomeView 
                notes={notes} 
                onOpenNote={handleOpenNote}
                onOpenUpload={() => setCurrentView('upload')}
                onOpenSearch={() => setCurrentView('search')}
                onOpenNotifications={() => setCurrentView('notifications')}
                uploadTasks={uploadTasks}
              />
            </motion.div>
          )}
          {currentView === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col"
            >
              <ProfileView />
            </motion.div>
          )}
          {currentView === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col"
            >
              <CalendarView />
            </motion.div>
          )}
          {currentView === 'workspaces' && (
            <motion.div
              key="workspaces"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col"
            >
              <WorkspacesView 
                notes={notes}
                onClose={() => setCurrentView("home")}
                onOpenNote={handleOpenNote}
              />
            </motion.div>
          )}
          {currentView === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col"
            >
              <NotificationsView onClose={() => setCurrentView("home")} />
            </motion.div>
          )}
          {currentView === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-30 flex flex-col bg-slate-50"
            >
              <SearchView 
                notes={notes} 
                onClose={() => setCurrentView('home')} 
                onOpenNote={handleOpenNote}
              />
            </motion.div>
          )}
          {currentView === 'transcript' && activeNote && (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-40 flex flex-col"
            >
              <TranscriptView note={activeNote} onBack={handleBackToHome} />
            </motion.div>
          )}
          {currentView === 'recording' && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-50 flex flex-col"
            >
              <RecordingView 
                onClose={() => setCurrentView('home')} 
                onSave={handleSaveRecording}
              />
            </motion.div>
          )}
          {currentView === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-50 flex flex-col"
            >
              <UploadView 
                onClose={() => setCurrentView('home')} 
                tasks={uploadTasks}
                onAddTasks={addUploadTasks}
                onRetryTask={retryUploadTask}
                onRemoveTask={removeUploadTask}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <BottomNav 
          currentView={currentView} 
          onChangeView={setCurrentView} 
          onStartRecording={() => setCurrentView('recording')}
        />
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
