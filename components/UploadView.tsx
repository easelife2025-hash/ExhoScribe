'use client';
import { useState, useRef } from 'react';
import { UploadTask } from '../types';
import { UploadCloud, X, FileAudio, FileVideo, CheckCircle2, AlertCircle, RefreshCw, XCircle, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UploadViewProps {
  onClose: () => void;
  tasks: UploadTask[];
  onAddTasks: (files: File[]) => void;
  onRetryTask: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onPauseTask: (taskId: string) => void;
  onResumeTask: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
}

export default function UploadView({ onClose, tasks, onAddTasks, onRetryTask, onRemoveTask, onPauseTask, onResumeTask, onCancelTask }: UploadViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFiles = (files: File[]) => {
    const validFiles: File[] = [];
    files.forEach(file => {
      if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        validFiles.push(file);
      } else {
        alert(`"${file.name}" is not a valid audio or video file.`);
      }
    });
    return validFiles;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const valid = validateFiles(files);
      if (valid.length > 0) onAddTasks(valid);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const valid = validateFiles(files);
      if (valid.length > 0) onAddTasks(valid);
    }
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex-1 bg-slate-50 flex flex-col h-full absolute inset-0 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pb-6 pt-[max(env(safe-area-inset-top),1.5rem)] bg-white border-b border-slate-100 sticky top-0 z-20">
        <h2 className="text-xl font-display font-semibold text-slate-900">Upload Media</h2>
        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* Drop Zone */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-[24px] flex flex-col items-center justify-center p-8 transition-colors cursor-pointer
            ${isDragging ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50'}`}
        >
          <input 
            type="file" 
            multiple 
            accept="audio/*,video/*"
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400'}`}>
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Click or drag files here</h3>
          <p className="text-sm text-slate-500 text-center">Supports MP3, WAV, M4A, MP4, MOV<br/>Up to 500MB per file</p>
        </div>

        {/* Upload Queue */}
        {tasks.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Upload Queue</h3>
              {tasks.some(t => t.status === 'uploading') && (
                <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full animate-pulse">
                  Uploading in background...
                </span>
              )}
            </div>
            
            <AnimatePresence>
              {tasks.map(task => {
                const isVideo = task.file.type.startsWith('video/');
                return (
                  <motion.div 
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        task.status === 'completed' ? 'bg-green-50 text-green-600' :
                        task.status === 'failed' ? 'bg-red-50 text-red-600' :
                        'bg-brand-50 text-brand-600'
                      }`}>
                        {isVideo ? <FileVideo className="w-5 h-5" /> : <FileAudio className="w-5 h-5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{task.file.name}</p>
                        <p className="text-xs text-slate-500">{(task.file.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {(task.status === 'uploading' || task.status === 'paused') && (
                           <div className="text-xs font-medium text-brand-600 w-10 text-right">{Math.round(task.progress)}%</div>
                        )}
                        {task.status === 'processing' && (
                           <div className="text-xs font-medium text-amber-600">Processing</div>
                        )}
                        {task.status === 'completed' && (
                           <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                        {task.status === 'failed' && (
                           <button onClick={() => onRetryTask(task.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Retry">
                             <RefreshCw className="w-4 h-4" />
                           </button>
                        )}
                        {task.status === 'uploading' && (
                           <button onClick={() => onPauseTask(task.id)} className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors" title="Pause">
                             <Pause className="w-5 h-5" />
                           </button>
                        )}
                        {task.status === 'paused' && (
                           <button onClick={() => onResumeTask(task.id)} className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors" title="Resume">
                             <Play className="w-5 h-5" />
                           </button>
                        )}
                        {(task.status === 'uploading' || task.status === 'paused' || task.status === 'pending') ? (
                           <button onClick={() => onCancelTask(task.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="Cancel">
                             <XCircle className="w-5 h-5" />
                           </button>
                        ) : (
                           <button onClick={() => onRemoveTask(task.id)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors" title="Remove">
                             <XCircle className="w-5 h-5" />
                           </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(task.status === 'uploading' || task.status === 'paused' || task.status === 'processing') && (
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${task.status === 'processing' ? 'bg-amber-500' : task.status === 'paused' ? 'bg-slate-400' : 'bg-brand-500'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${task.progress}%` }}
                          transition={{ ease: "linear", duration: 0.2 }}
                        />
                      </div>
                    )}
                    
                    {task.status === 'failed' && task.error && (
                      <div className="text-xs text-red-600 flex items-center gap-1.5 bg-red-50 p-2 rounded-lg">
                        <AlertCircle className="w-3.5 h-3.5" /> {task.error}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
