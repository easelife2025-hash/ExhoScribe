const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// Find the end of processUpload
const processUploadEnd = code.indexOf('  }, []);\n  const addUploadTasks = useCallback((files: File[]) => {');
const firstAddUploadTask = processUploadEnd + '  }, []);\n'.length;

// Find the start of `if (loading) {`
const ifLoadingStart = code.indexOf('  if (loading) {');

// The correct block of addUploadTasks, removeUploadTask, retryUploadTask
const correctBlock = `  const addUploadTasks = useCallback((files: File[]) => {
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

`;

code = code.substring(0, firstAddUploadTask) + correctBlock + code.substring(ifLoadingStart);
fs.writeFileSync('app/page.tsx', code);
