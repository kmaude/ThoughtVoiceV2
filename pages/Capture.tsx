import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mic, Settings, X, Camera, UploadCloud, CheckCircle, Shield, RefreshCw, ArrowLeft, FileVideo, FileAudio, Grid3X3, Edit2, Play, Eye, EyeOff, AlertCircle, Type, Minus, Plus, Pause, Video, Download, StopCircle, ChevronUp, ChevronDown, BookOpen, Info, Save } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { db } from '../services/database';
import { notificationService } from '../services/notifications';
import { ContentItem, ContentStatus, ContentType, DailyPrompt } from '../types';
import { OwlLogo } from '../components/OwlLogo';

const SPEED_STEPS = [0, 1.0, 1.2, 1.5, 1.8, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0];

export const Capture: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlMode = searchParams.get('mode');
  const [mode, setMode] = useState<'video' | 'audio'>(urlMode === 'audio' ? 'audio' : 'video');
  const promptId = searchParams.get('promptId');
  const topicId = searchParams.get('topicId');

  const [promptData, setPromptData] = useState<DailyPrompt | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false); 
  const [submissionId, setSubmissionId] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [settingsDefaultMode, setSettingsDefaultMode] = useState<'video' | 'audio'>('video');
  const [showGuides, setShowGuides] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Teleprompter State
  const [showTeleprompter, setShowTeleprompter] = useState(true);
  const [teleprompterMode, setTeleprompterMode] = useState<'QUESTION' | 'NOTES'>('QUESTION');
  const [userNotes, setUserNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  
  // Teleprompter Controls
  const [prompterFontSize, setPrompterFontSize] = useState<number>(24);
  const [speedIdx, setSpeedIdx] = useState<number>(1); 
  const [isPrompterPlaying, setIsPrompterPlaying] = useState(false);
  const prompterScrollRef = useRef<HTMLDivElement>(null);

  // Countdown State
  const [countdown, setCountdown] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Teleprompter Auto-Scroll Logic - Ensure it advances lines of text
  useEffect(() => {
    let animationFrameId: number;
    const scroll = () => {
      if (prompterScrollRef.current && isPrompterPlaying && teleprompterMode === 'NOTES' && !isEditingNotes) {
        const currentSpeed = SPEED_STEPS[speedIdx];
        if (currentSpeed > 0) {
          // Incrementally scroll the element's content
          prompterScrollRef.current.scrollTop += (currentSpeed * 0.45);
        }
        animationFrameId = requestAnimationFrame(scroll);
      }
    };
    // FIX: Removed the unused part of the comma operator expression
    if (isPrompterPlaying && teleprompterMode === 'NOTES' && !isEditingNotes) {
      animationFrameId = requestAnimationFrame(scroll);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPrompterPlaying, speedIdx, teleprompterMode, isEditingNotes]);

  useEffect(() => {
    const loadContext = async () => {
      const user = await db.getUser();
      if (user) {
        setSettingsDefaultMode(user.defaultCaptureMode || 'video');
        if (!urlMode && user.defaultCaptureMode) {
          setMode(user.defaultCaptureMode);
        }
        if (user.preferredVideoDeviceId) setSelectedVideoDevice(user.preferredVideoDeviceId);
        if (user.preferredAudioDeviceId) setSelectedAudioDevice(user.preferredAudioDeviceId);
      }

      if (promptId) {
        const savedPrompt = db.getPrompt(promptId);
        if (savedPrompt) {
          setPromptData(savedPrompt);
        } else if (user) {
          const p = await geminiService.generateDailyPrompt(user);
          setPromptData(p);
        }
      }
    };
    loadContext();
  }, [promptId, urlMode]);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const dev = await navigator.mediaDevices.enumerateDevices();
        setDevices(dev);
        const videoInput = dev.find(d => d.kind === 'videoinput');
        const audioInput = dev.find(d => d.kind === 'audioinput');
        if (videoInput && !selectedVideoDevice) setSelectedVideoDevice(videoInput.deviceId);
        if (audioInput && !selectedAudioDevice) setSelectedAudioDevice(audioInput.deviceId);
      } catch (err) {
        console.error("Error enumerating devices", err);
      }
    };
    getDevices();
  }, []);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const initMedia = async () => {
      setCameraError(null);
      try {
        const constraints: MediaStreamConstraints = {
          audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true,
          video: mode === 'video' ? {
             deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined,
             width: { ideal: 1920 }, height: { ideal: 1080 }
          } : false
        };
        
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
          console.warn("Requested media constraints failed, trying fallback...", e);
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: mode === 'video'
          });
        }
        activeStream = stream;
        if (videoRef.current && mode === 'video') {
          videoRef.current.srcObject = stream;
        }
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mode === 'video' ? 'video/webm' : 'audio/webm' });
          setMediaBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current = mediaRecorder;
      } catch (err) {
        console.error("Error accessing media:", err);
        setCameraError("Could not start video/audio source. Please check permissions and ensure the device is not in use.");
      }
    };
    if (!mediaBlob && !isSubmitted && !isProcessing) {
        initMedia();
    }
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mode, mediaBlob, isSubmitted, selectedVideoDevice, selectedAudioDevice, isProcessing]);

  const toggleRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      setIsPrompterPlaying(false);
    } else {
      setCountdown(3);
      let count = 3;
      const interval = setInterval(() => {
          count--;
          setCountdown(count);
          if (count === 0) {
              clearInterval(interval);
              setCountdown(null);
              chunksRef.current = [];
              mediaRecorderRef.current?.start();
              setIsRecording(true);
              if (SPEED_STEPS[speedIdx] > 0 && teleprompterMode === 'NOTES') {
                setIsPrompterPlaying(true);
                setIsEditingNotes(false);
              }
          }
      }, 1000);
    }
  };

  const handleReset = () => {
    setMediaBlob(null);
    setPreviewUrl(null);
    chunksRef.current = [];
    setIsSubmitted(false);
  };

  const handleDownloadLocal = () => {
    if (mediaBlob && previewUrl) {
      const a = document.createElement('a');
      a.href = previewUrl;
      a.download = `thoughtvoice_capture_${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const user = await db.getUser();
      if (user) {
        await db.updateUser({
          preferredVideoDeviceId: selectedVideoDevice,
          preferredAudioDeviceId: selectedAudioDevice,
          defaultCaptureMode: settingsDefaultMode
        });
      }
      setShowDeviceSettings(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setShowDeviceSettings(false);
    }
  };

  const handleSubmitToEditors = async () => {
    if (!mediaBlob) return;
    window.onbeforeunload = () => "Upload in progress...";
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const profile = await db.getUser();
      if (!profile) throw new Error("User not found");

      setProcessingStep('Initiating secure transfer...');
      const estimatedDuration = 3000;
      const steps = 50;
      const interval = estimatedDuration / steps;

      for (let i = 0; i <= 100; i += 2) {
        setUploadProgress(i);
        if (i < 30) setProcessingStep('Encrypting media...');
        else if (i < 80) setProcessingStep('Uploading to Cloud Storage...');
        else setProcessingStep('Verifying integrity...');
        await new Promise(r => setTimeout(r, interval));
      }

      setProcessingStep('Generating assets & transcript...');
      const context = promptData?.context || "Strategic overview.";
      const transcript = await geminiService.mockTranscribe(context);

      setProcessingStep('Registering project folder...');
      const assets = await geminiService.processContentPipeline(transcript, profile, mode === 'video' ? 'VIDEO' : 'AUDIO');
      const contentId = `content-${Date.now()}`;
      
      const title = promptData ? (assets.hooks[0] || 'Untitled Thought') : `Self captured ${new Date().toLocaleDateString('en-US').replace(/\//g, '')}`;

      const newItem: ContentItem = {
        id: contentId,
        userId: profile.id,
        title: title,
        createdAt: new Date().toISOString(),
        status: ContentStatus.SUBMITTED_TO_EDITORS, 
        type: mode === 'video' ? ContentType.VIDEO : ContentType.AUDIO,
        originalTranscript: transcript,
        assets: assets, 
        topicId: topicId || undefined,
        promptId: promptId || undefined,
        promptContext: promptData?.context || undefined
      };

      await db.createContent(newItem);
      await notificationService.notifyNewSubmission(profile, newItem);

      setSubmissionId(contentId);
      window.onbeforeunload = null;
      setIsProcessing(false);
      setIsSubmitted(true);

    } catch (error) {
      console.error(error);
      alert("Submission failed.");
      window.onbeforeunload = null;
      setIsProcessing(false);
    }
  };

  if (isSubmitted) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-white">
          <div className="max-w-lg w-full bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 p-10 text-center animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-tv-teal opacity-5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/20 animate-fade-in-up">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Upload Complete</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Your thought leadership piece has been securely uploaded. Our editors have been notified.
              </p>
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5 mb-8 text-left relative">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Tracking ID</span>
                    <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">QUEUED</span>
                 </div>
                 <code className="text-xl font-mono font-bold text-slate-200 block mb-1 tracking-wide">{submissionId}</code>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => { handleReset(); }} className="w-full py-4 bg-white/10 border border-white/5 text-white rounded-xl font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                   <RefreshCw size={18} /> Record Another
                 </button>
                 <button onClick={() => navigate('/')} className="w-full py-4 bg-tv-teal text-white rounded-xl font-bold hover:bg-teal-600 transition-all shadow-lg shadow-teal-900/20">
                   Dashboard
                 </button>
              </div>
            </div>
          </div>
        </div>
      );
  }

  if (isProcessing) {
      return (
        <div className="h-[100dvh] bg-slate-900 flex flex-col items-center justify-center text-white relative overflow-hidden">
          <div className="relative z-10 max-w-md w-full p-8 text-center space-y-8">
            <div className="relative">
               <OwlLogo size={100} className="mx-auto" />
               <div className="absolute inset-0 border-4 border-tv-teal/30 border-t-tv-teal rounded-full animate-spin"></div>
            </div>
            <div>
               <h2 className="text-3xl font-bold mb-2">Uploading Capture</h2>
               <p className="text-slate-400 text-sm">Encrypting & Transferring...</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                 <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                 <div className="bg-gradient-to-r from-tv-teal to-tv-coral h-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-2 bg-slate-800/50 py-1 px-3 rounded-full inline-block border border-slate-700">
                 {processingStep}
              </div>
            </div>
          </div>
        </div>
      );
  }

  return (
    <div className="flex h-[100dvh] bg-slate-900 relative overflow-hidden">
      {countdown !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
           <div className="text-[200px] font-bold text-white animate-ping opacity-75">{countdown}</div>
        </div>
      )}

      {/* Floating Teleprompter Window - 65% Transparency & Compact Controls */}
      <div className={`absolute top-0 left-0 right-0 z-40 transition-all duration-500 flex justify-center p-4 ${showTeleprompter ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="bg-black/35 backdrop-blur-md text-white rounded-2xl w-full max-w-2xl border border-white/20 shadow-2xl mt-4 relative flex flex-col h-[58vh] overflow-hidden">
            
            {/* High Contrast Header */}
            <div className="flex items-center justify-between bg-slate-900 px-5 py-3 border-b border-white/10 shrink-0">
                <div className="flex gap-2">
                    <button 
                      onClick={() => setTeleprompterMode('QUESTION')} 
                      className={`px-4 py-1.5 text-xs rounded-lg font-bold transition-all border ${teleprompterMode === 'QUESTION' ? 'bg-white text-slate-900 border-white' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'}`}
                    >
                        Question
                    </button>
                    <button 
                      onClick={() => setTeleprompterMode('NOTES')} 
                      className={`px-4 py-1.5 text-xs rounded-lg font-bold flex items-center gap-2 transition-all border ${teleprompterMode === 'NOTES' ? 'bg-white text-slate-900 border-white' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'}`}
                    >
                        <Edit2 size={12} /> Script
                    </button>
                </div>
                <button onClick={() => setShowTeleprompter(false)} className="bg-slate-800 text-white/60 hover:text-white p-2 rounded-full border border-slate-700 transition-colors"><X size={18} /></button>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Main Text Content Area - Rigid for text scrolling fix */}
                <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
                    
                    {/* Red Focus Marker (Line Guide) - ONLY ON SCRIPT MODE */}
                    {teleprompterMode === 'NOTES' && !isEditingNotes && (
                        <div className="absolute top-[35%] left-0 right-0 h-1 z-20 pointer-events-none flex items-center">
                            <div className="w-3 h-5 bg-red-600 rounded-r shadow-[0_0_15px_rgba(220,38,38,0.7)]"></div>
                            <div className="flex-1 h-0.5 bg-red-600/50"></div>
                            <div className="w-3 h-5 bg-red-600 rounded-l shadow-[0_0_15px_rgba(220,38,38,0.7)]"></div>
                        </div>
                    )}

                    <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
                    <div 
                        ref={prompterScrollRef} 
                        className={`overflow-y-auto h-full text-left no-scrollbar scroll-auto p-8 relative z-10 ${teleprompterMode === 'NOTES' && !isEditingNotes ? 'pt-[35vh]' : 'pt-8'}`} 
                    >
                        <div className={`space-y-6 ${teleprompterMode === 'NOTES' && !isEditingNotes ? 'pb-[60vh]' : 'pb-8'}`}>
                            {teleprompterMode === 'QUESTION' ? (
                                <div className="space-y-8 animate-fade-in">
                                    <div 
                                        style={{ fontSize: `${prompterFontSize}px` }} 
                                        className="font-black leading-[1.4] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,1)]"
                                    >
                                        {promptData ? promptData.question : "Capture Mode: Speak freely!"}
                                    </div>
                                    
                                    {promptData && (
                                        <div className="space-y-6 pt-6 border-t border-white/20">
                                            <div className="flex items-center gap-2 text-tv-teal">
                                                <Info size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Strategy & Context</span>
                                            </div>
                                            <div className="space-y-4">
                                                <p className="text-sm font-bold text-slate-200 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                                                    {promptData.reasoning}
                                                </p>
                                                {promptData.contextPoints && promptData.contextPoints.length > 0 && (
                                                    <div className="space-y-2">
                                                        {promptData.contextPoints.map((point, i) => (
                                                            <div key={i} className="flex gap-3 text-slate-300 items-start">
                                                                <span className="text-tv-coral font-bold">•</span>
                                                                <p className="text-xs font-medium leading-relaxed">{point}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="mt-4 pt-4 border-t border-white/10 opacity-60 italic text-xs text-slate-400">
                                                    {promptData.context}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                isEditingNotes ? (
                                    <textarea 
                                        value={userNotes} 
                                        onChange={e => setUserNotes(e.target.value)} 
                                        autoFocus
                                        style={{ fontSize: `${prompterFontSize}px` }} 
                                        className="w-full bg-slate-900/50 p-4 border border-white/10 rounded-xl resize-none focus:outline-none h-[40vh] placeholder-white/20 leading-[1.6] text-white font-bold" 
                                        placeholder="Paste or type your script here..." 
                                    />
                                ) : (
                                    <div 
                                        style={{ fontSize: `${prompterFontSize}px` }} 
                                        className="whitespace-pre-wrap font-black leading-[1.6] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,1)] cursor-pointer"
                                        onClick={() => !isRecording && setIsEditingNotes(true)}
                                    >
                                        {userNotes || "Click the Edit icon to add your script..."}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Controls Cluster - Move Up/Compact Fix */}
                <div className="w-18 bg-slate-900 border-l border-white/10 flex flex-col items-center py-4 gap-3 shrink-0 z-30">
                    {/* Play/Pause */}
                    <button 
                      onClick={() => setIsPrompterPlaying(!isPrompterPlaying)} 
                      disabled={teleprompterMode === 'QUESTION' || isEditingNotes}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${teleprompterMode === 'QUESTION' || isEditingNotes ? 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed' : (isPrompterPlaying ? 'bg-red-600 text-white animate-pulse' : 'bg-green-600 text-white hover:bg-green-500')}`}
                    >
                        {isPrompterPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                    </button>

                    {/* Secondary Record Button in Teleprompter */}
                    <button 
                        onClick={toggleRecording} 
                        disabled={countdown !== null}
                        className={`w-10 h-10 rounded-full border-[2px] border-white/20 flex items-center justify-center transition-all ${isRecording ? 'scale-110' : 'hover:scale-105'}`}
                    >
                        <div className={`transition-all duration-300 ${isRecording ? 'w-4 h-4 rounded-sm bg-red-500' : 'w-7 h-7 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]'}`}></div>
                    </button>

                    {/* Edit Toggle for Notes */}
                    {teleprompterMode === 'NOTES' && (
                        <button 
                            onClick={() => { setIsEditingNotes(!isEditingNotes); setIsPrompterPlaying(false); }}
                            className={`p-2 rounded-lg border transition-all ${isEditingNotes ? 'bg-tv-teal text-white border-tv-teal shadow-lg shadow-teal-900/40' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                            title={isEditingNotes ? "Save Script" : "Edit Script"}
                        >
                            {isEditingNotes ? <Save size={18} /> : <Edit2 size={18} />}
                        </button>
                    )}

                    {/* Speed Controls Cluster */}
                    <div className={`flex flex-col items-center gap-1 ${teleprompterMode === 'QUESTION' || isEditingNotes ? 'opacity-30 pointer-events-none' : ''}`}>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Speed</span>
                        <button onClick={() => setSpeedIdx(Math.min(SPEED_STEPS.length - 1, speedIdx + 1))} className="p-1 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 text-white"><ChevronUp size={14} /></button>
                        <div className="h-8 w-10 flex items-center justify-center bg-slate-800 rounded-md border border-tv-teal/40">
                            <span className="text-[10px] font-mono font-bold text-tv-teal">
                                {SPEED_STEPS[speedIdx] === 0 ? 'OFF' : `${SPEED_STEPS[speedIdx]}x`}
                            </span>
                        </div>
                        <button onClick={() => setSpeedIdx(Math.max(0, speedIdx - 1))} className="p-1 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 text-white"><ChevronDown size={14} /></button>
                    </div>

                    {/* Font Size Cluster - No mt-auto to keep it from hitting the bottom edge */}
                    <div className="flex flex-col items-center gap-1 pt-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Font</span>
                        <button onClick={() => setPrompterFontSize(Math.min(64, prompterFontSize + 2))} className="p-1 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 text-white"><Plus size={14} /></button>
                        <div className="text-[11px] font-bold text-white">{prompterFontSize}</div>
                        <button onClick={() => setPrompterFontSize(Math.max(16, prompterFontSize - 2))} className="p-1 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 text-white"><Minus size={14} /></button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-50">
        <button onClick={() => navigate('/')} className="p-3 bg-slate-900/80 text-white rounded-full hover:bg-slate-900 border border-white/20 transition-transform active:scale-95 shadow-xl"><ArrowLeft size={20} /></button>
      </div>

      {/* Show Teleprompter Toggle (if hidden) */}
      {!showTeleprompter && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
           <button onClick={() => setShowTeleprompter(true)} className="px-8 py-3 bg-slate-900 text-white rounded-full hover:bg-black border border-white/20 flex items-center gap-3 text-sm font-bold shadow-2xl transition-all">
             <Eye size={20} className="text-tv-teal" /> Show Teleprompter
           </button>
        </div>
      )}

      {/* Camera Preview + Framing Outline */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {!mediaBlob ? (
          mode === 'video' ? (
             <div className="relative w-full h-full">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                
                {/* Framing Outline Guidance */}
                {showGuides && !isRecording && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        <svg className="w-[60%] h-[70%] text-white/20 mb-8" viewBox="0 0 200 200" fill="none">
                           {/* Head Outline */}
                           <circle cx="100" cy="55" r="32" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" />
                           {/* Torso/Shoulders Outline */}
                           <path 
                             d="M 25,190 C 25,135 65,105 100,105 C 135,105 175,135 175,190" 
                             stroke="currentColor" 
                             strokeWidth="1.5" 
                             strokeDasharray="6 4" 
                           />
                        </svg>
                        <div className="bg-black/50 backdrop-blur-sm px-6 py-2 rounded-full border border-white/10">
                            <span className="text-[12px] font-bold text-white uppercase tracking-[0.4em] opacity-90">Align Frame</span>
                        </div>
                    </div>
                )}
             </div>
          ) : (
            <div className="text-center">
              <Mic size={100} className="text-tv-coral mx-auto mb-8 opacity-40 animate-pulse" />
              <h3 className="text-3xl font-bold text-white/50 tracking-tight">Audio Recording Active</h3>
            </div>
          )
        ) : (
           mode === 'video' ? <video src={previewUrl!} controls className="max-h-full max-w-full" /> : 
           <div className="text-center p-16 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
              <FileAudio size={64} className="text-tv-teal mx-auto mb-8" />
              <h3 className="text-2xl font-bold text-white mb-8">Review Recording</h3>
              <audio src={previewUrl!} controls className="w-96" />
           </div>
        )}
      </div>

      {/* Bottom Circular Control Bar */}
      <div className="absolute bottom-10 left-0 right-0 z-50 flex items-center justify-center gap-4">
           {!mediaBlob && !cameraError ? (
             <div className="flex items-center gap-6 p-4 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                {/* Mode Switch */}
                <button 
                    onClick={() => setMode(mode === 'video' ? 'audio' : 'video')} 
                    className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all border border-slate-700 shadow-lg"
                    title={mode === 'video' ? 'Switch to Audio' : 'Switch to Video'}
                >
                    {mode === 'video' ? <Mic size={24} /> : <FileVideo size={24} />}
                </button>
               
                {/* Main Record Action */}
                <button 
                    onClick={toggleRecording} 
                    disabled={countdown !== null} 
                    className={`relative flex items-center justify-center transition-all duration-300 ${isRecording ? 'scale-110' : 'hover:scale-105'}`}
                >
                    <div className={`rounded-full border-[4px] border-white/20 flex items-center justify-center ${isRecording ? 'w-20 h-20' : 'w-18 h-18'}`}>
                        <div className={`transition-all duration-300 ${isRecording ? 'w-8 h-8 rounded-md bg-red-500' : 'w-14 h-14 rounded-full bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.6)] border-2 border-red-500/50'}`}></div>
                    </div>
                </button>

                {/* Grid Toggle */}
                <button 
                    onClick={() => setShowGuides(!showGuides)} 
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border shadow-lg ${showGuides ? 'bg-white text-slate-900 border-white' : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'}`}
                    title="Toggle Guides"
                >
                    <Grid3X3 size={24} />
                </button>

                {/* Device Settings */}
                <button 
                    onClick={() => setShowDeviceSettings(true)} 
                    className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all border border-slate-700 shadow-lg"
                    title="Hardware Settings"
                >
                    <Settings size={24} />
                </button>
             </div>
           ) : (
             !cameraError && (
                <div className="flex flex-col gap-4 items-center">
                    <div className="flex gap-6 p-5 rounded-full bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl animate-fade-in-up">
                        <button onClick={handleReset} className="px-10 py-4 rounded-full bg-slate-800 text-white font-black text-sm hover:bg-slate-700 transition-colors uppercase tracking-widest border border-slate-700">Retake</button>
                        <button onClick={handleDownloadLocal} className="w-12 h-12 rounded-full bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center justify-center shadow-lg" title="Save to Device">
                            <Download size={22} />
                        </button>
                        <button onClick={handleSubmitToEditors} className="px-10 py-4 rounded-full bg-tv-teal text-white font-black text-sm flex items-center gap-3 hover:bg-teal-500 transition-all shadow-lg shadow-teal-500/30 uppercase tracking-widest">
                            Send to Editor <UploadCloud size={20} />
                        </button>
                    </div>
                </div>
             )
           )}
      </div>

      {/* Camera Error Messaging */}
      {cameraError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-xl p-8">
            <div className="max-w-md text-center bg-slate-800 p-10 rounded-3xl border border-slate-700 shadow-3xl">
                <AlertCircle size={64} className="text-red-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">Hardware Access Error</h3>
                <p className="text-slate-400 text-base mb-8 leading-relaxed">{cameraError}</p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => window.location.reload()} className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors">Try Reconnecting</button>
                    <button onClick={() => navigate('/')} className="w-full py-4 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors">Return to Dashboard</button>
                </div>
            </div>
        </div>
      )}

      {/* Settings Modal (Overlay) */}
      {showDeviceSettings && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-lg z-[100] flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-10 shadow-3xl animate-fade-in-up">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Settings size={24} className="text-tv-teal" /> Hardware Setup
                    </h3>
                    <button onClick={() => setShowDeviceSettings(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                  </div>
                  
                  <div className="space-y-8">
                      <div>
                          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 block mb-3">Primary Camera</label>
                          <select 
                            value={selectedVideoDevice} 
                            onChange={e => setSelectedVideoDevice(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-tv-teal transition-all shadow-inner"
                          >
                              {devices.filter(d => d.kind === 'videoinput').map(d => (
                                  <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 4)}`}</option>
                              ))}
                          </select>
                      </div>
                      
                      <div>
                          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 block mb-3">Audio Input</label>
                          <select 
                             value={selectedAudioDevice} 
                             onChange={e => setSelectedAudioDevice(e.target.value)}
                             className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-tv-teal transition-all shadow-inner"
                          >
                              {devices.filter(d => d.kind === 'audioinput').map(d => (
                                  <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0, 4)}`}</option>
                              ))}
                          </select>
                      </div>

                      <div className="pt-6 flex flex-col gap-4">
                          <button onClick={handleSaveSettings} className="w-full py-5 bg-tv-teal text-white font-black rounded-2xl hover:bg-teal-500 shadow-xl shadow-teal-900/30 uppercase tracking-widest transition-all">Save & Update</button>
                          <button onClick={() => setShowDeviceSettings(false)} className="w-full py-2 text-slate-500 font-bold hover:text-white transition-colors text-sm">Dismiss</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};