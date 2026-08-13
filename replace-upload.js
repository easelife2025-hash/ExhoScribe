const fs = require('fs');
const content = fs.readFileSync('app/page.tsx', 'utf8');

const oldProcessUploadStart = "const processUpload = useCallback(async (taskId: string, file: File, currentUser: any) => {";
const oldProcessUploadEnd = "  const addUploadTasks = useCallback((files: File[]) => {";

const newProcessUpload = `const processUpload = useCallback(async (taskId: string, file: File, currentUser: any) => {
    try {
      setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 0, status: 'uploading' } : t));

      let fileUrl = '';
      
      if (currentUser?.uid) {
        // Upload to Firebase Storage
        const fileRef = storageRef(storage, \`uploads/\${currentUser.uid}/\${Date.now()}-\${file.name}\`);
        const uploadTask = uploadBytesResumable(fileRef, file);
        
        firebaseTasksRef.current.set(taskId, {
          pause: () => uploadTask.pause(),
          resume: () => uploadTask.resume(),
          cancel: () => {
            uploadTask.cancel();
            throw new Error("Upload cancelled");
          }
        });
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 50; // First 50% is upload
              setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress, status: snapshot.state === 'paused' ? 'paused' : 'uploading' } : t));
            }, 
            (error) => {
              reject(error);
            }, 
            () => {
              resolve();
            }
          );
        });
        
        setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 50, status: 'processing' } : t));
        fileUrl = await getDownloadURL(fileRef);
      } else {
        throw new Error("Must be logged in to upload files.");
      }

      // 2. Call API to process the file URL
      const response = await fetch('/api/process-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileUrl,
          fileName: file.name,
          mimeType: file.type
        })
      });
      
      if (!response.ok) {
        let errorMsg = \`Server Error \${response.status}\`;
        try {
          const res = await response.json();
          if (res.error) errorMsg = res.error;
        } catch(e) {
           errorMsg += " failed to parse error response";
        }
        throw new Error(errorMsg);
      }
      
      const aiResult = await response.json();
      
      setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 100 } : t));

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
        fileUrl: aiResult.fileUrl || fileUrl,
      };

      if (currentUser?.uid) {
        await saveNote(currentUser.uid, newNote);
        setNotes(prev => [newNote, ...prev]);

        setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 100, status: 'completed' } : t));
        
        await saveNotification(currentUser.uid, {
          title: 'Upload Complete',
          message: \`\${file.name} has been processed successfully.\`,
          link: newNote.id
        });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'failed', error: error.message } : t));
    }
  }, []);

`;

const startIdx = content.indexOf(oldProcessUploadStart);
const endIdx = content.indexOf(oldProcessUploadEnd);
if (startIdx !== -1 && endIdx !== -1) {
  const newContent = content.substring(0, startIdx) + newProcessUpload + content.substring(endIdx);
  fs.writeFileSync('app/page.tsx', newContent);
  console.log("Success");
} else {
  console.log("Could not find boundaries", startIdx, endIdx);
}
