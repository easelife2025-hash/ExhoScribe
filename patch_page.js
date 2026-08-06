const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');
const oldProcessUpload = `  const processUpload = useCallback(async (taskId: string, file: File, currentUser: any) => {
    try {
      setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 10, status: 'uploading' } : t));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'gemini-3.6-flash');

      setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 50, status: 'processing' } : t));

      const response = await fetch('/api/process-media', {
        method: 'POST',
        body: formData,
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

      import('@/lib/db').then(({ saveNote }) => {
        saveNote(currentUser.uid, newNote);
      });
      
      setNotes(prev => [newNote, ...prev]);

      setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 100, status: 'completed' } : t));

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'failed', error: error.message || 'Upload failed' } : t));
    }
  }, []);`;

const patch = fs.readFileSync('patch2.txt', 'utf8');

// The original code might be slightly different. Let's do a regex replacement.
const regex = /const processUpload = useCallback\(async \(taskId: string, file: File, currentUser: any\) => \{[\s\S]*?\}, \[processUpload, user\]\);/g;

code = code.replace(regex, patch.trim());
fs.writeFileSync('app/page.tsx', code);
