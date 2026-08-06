'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Pause, Square, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecordingViewProps {
  onClose: () => void;
  onSave: (file: File) => void;
}

const mockLiveTranscript: string[] = [];

type RecordingState = 'prompting' | 'denied' | 'recording' | 'paused' | 'uploading';

export default function RecordingView({ onClose, onSave }: RecordingViewProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('prompting');
  const [time, setTime] = useState(0);
  const [transcriptSegments, setTranscriptSegments] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioVolumes, setAudioVolumes] = useState<number[]>(Array(24).fill(0));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize recording
  useEffect(() => {
    let mounted = true;
    let chunks: BlobPart[] = [];

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        setRecordingState('recording');

        // Setup MediaRecorder
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
          onSave(file);
        };

        mediaRecorder.start();

        // Setup AudioContext for visualizer
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        dataArrayRef.current = dataArray;

        const updateVisualizer = () => {
          if (analyserRef.current && dataArrayRef.current) {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
            const volumes = [];
            const step = Math.max(1, Math.floor(dataArrayRef.current.length / 24));
            for (let i = 0; i < 24; i++) {
              let sum = 0;
              for (let j = 0; j < step; j++) {
                sum += dataArrayRef.current[i * step + j] || 0;
              }
              const average = sum / step;
              volumes.push(average);
            }
            setAudioVolumes(volumes);
          }
          animationFrameRef.current = requestAnimationFrame(updateVisualizer);
        };
        
        updateVisualizer();

      } catch (err) {
        if (mounted) {
          setRecordingState('denied');
        }
      }
    };

    startRecording();

    return () => {
      mounted = false;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recordingState === 'recording') {
      interval = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [recordingState]);

  // Simulate incoming transcript
  useEffect(() => {
    if (recordingState !== 'recording') return;
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < mockLiveTranscript.length) {
        setTranscriptSegments(prev => [...prev, mockLiveTranscript[currentIndex]]);
        currentIndex++;
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [recordingState]);

  // Handle uploading progress
  useEffect(() => {
    // Simulated upload removed
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handlePauseResume = () => {
    if (recordingState === 'recording') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
      setRecordingState('paused');
    } else if (recordingState === 'paused') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      setRecordingState('recording');
    }
  };

  const handleStop = () => {
    if (recordingState === 'recording' || recordingState === 'paused') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setRecordingState('uploading');
    }
  };

  if (recordingState === 'prompting' || recordingState === 'denied') {
    return (
      <div className="flex-1 bg-slate-900 flex flex-col items-center justify-center p-8 absolute inset-0 z-50">
        <button onClick={onClose} className="absolute top-[max(env(safe-area-inset-top),1.5rem)] left-6 p-2 bg-slate-800/50 rounded-full text-slate-300 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
          {recordingState === 'prompting' ? (
            <Mic className="w-8 h-8 text-brand-500 animate-pulse" />
          ) : (
            <MicOff className="w-8 h-8 text-red-500" />
          )}
        </div>
        <h2 className="text-2xl font-display font-semibold text-white mb-2">
          {recordingState === 'prompting' ? 'Allow Microphone' : 'Access Denied'}
        </h2>
        <p className="text-slate-400 text-center max-w-[280px] mb-8">
          {recordingState === 'prompting' 
            ? 'We need access to your microphone to transcribe your meeting.' 
            : 'Please enable microphone access in your browser or device settings to use this feature.'}
        </p>
        {recordingState === 'denied' && (
          <button onClick={onClose} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-medium">
            Go Back
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-900 flex flex-col h-full absolute inset-0 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pb-6 pt-[max(env(safe-area-inset-top),1.5rem)]">
        <button onClick={onClose} disabled={recordingState === 'uploading'} className="p-2 bg-slate-800/50 rounded-full text-slate-300 hover:text-white transition-colors disabled:opacity-50">
          <X className="w-5 h-5" />
        </button>
        {recordingState !== 'uploading' && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${recordingState === 'paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            <div className={`w-2 h-2 rounded-full ${recordingState === 'paused' ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`} />
            {recordingState === 'paused' ? 'PAUSED' : 'RECORDING'}
          </div>
        )}
        <div className="w-9" /> {/* Spacer */}
      </div>

      {/* Live Transcript Area */}
      <div className="flex-1 px-6 overflow-y-auto no-scrollbar flex flex-col justify-end pb-8 relative">
        <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-slate-900 to-transparent z-10 pointer-events-none" />
        
        {recordingState !== 'uploading' ? (
          <div className="flex flex-col gap-4 text-xl md:text-2xl font-display font-medium leading-relaxed tracking-tight text-slate-300">
            <AnimatePresence>
              {transcriptSegments.map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: i === transcriptSegments.length - 1 ? 1 : 0.4, y: 0 }}
                  className={i === transcriptSegments.length - 1 ? "text-white" : ""}
                >
                  {text}
                </motion.div>
              ))}
            </AnimatePresence>
            {recordingState === 'recording' && (
               <motion.div 
                 animate={{ opacity: [0.3, 1, 0.3] }} 
                 transition={{ repeat: Infinity, duration: 1.5 }}
                 className="h-6 w-3 bg-brand-500 rounded-full mt-2"
               />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
               <h3 className="text-2xl font-display font-semibold text-white mb-2">Saving & Uploading</h3>
               <p className="text-slate-400 mb-8">Processing your audio with AI...</p>
               
               <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden mb-4 mx-auto">
                 <motion.div 
                   className="h-full bg-brand-500"
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min(100, uploadProgress)}%` }}
                 />
               </div>
               <div className="text-sm font-medium text-slate-300">{Math.min(100, Math.floor(uploadProgress))}%</div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Controls Container */}
      <div className="bg-slate-800 rounded-t-[40px] pt-8 pb-[max(env(safe-area-inset-bottom),2.5rem)] px-8 flex flex-col items-center shadow-[0_-10px_40px_rgba(0,0,0,0.3)] relative">
        <div className="text-4xl font-display font-light text-white mb-8 tabular-nums tracking-wider">
          {formatTime(time)}
        </div>

        {/* Real Audio Visualizer */}
        <div className="flex items-center justify-center gap-1 h-16 mb-10 w-full max-w-[200px]">
          {audioVolumes.map((vol, i) => {
            const height = recordingState === 'recording' ? Math.max(4, (vol / 255) * 48) : 4;
            return (
              <motion.div
                key={i}
                className={`w-1.5 rounded-full ${recordingState === 'paused' ? 'bg-slate-500' : 'bg-brand-500'}`}
                animate={{ height }}
                transition={{ type: 'tween', duration: 0.05 }}
              />
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-8">
          <button 
            onClick={handlePauseResume}
            disabled={recordingState === 'uploading'}
            className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-white hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            {recordingState === 'paused' ? <Mic className="w-6 h-6" /> : <Pause className="w-6 h-6 fill-current" />}
          </button>
          
          <button 
            onClick={handleStop}
            disabled={recordingState === 'uploading'}
            className="w-20 h-20 rounded-[24px] bg-brand-600 flex items-center justify-center text-white hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50"
          >
            {recordingState === 'uploading' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full" />
              </motion.div>
            ) : (
              <Square className="w-8 h-8 fill-current" />
            )}
          </button>
          
          <div className="w-14 h-14" /> {/* Spacer for symmetry */}
        </div>
      </div>
    </div>
  );
}
