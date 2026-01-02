
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface VideoDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LOADING_MESSAGES = [
  "Initializing Audit Aperture...",
  "Synthesizing 3D Financial Visualization...",
  "Rendering AI Reasoning Layer...",
  "Optimizing Cinematic Sequence...",
  "Finalizing Data Stream Simulation...",
  "DocFlow Intelligence Ready."
];

const VideoDemoModal: React.FC<VideoDemoModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'IDLE' | 'AUTH_REQUIRED' | 'GENERATING' | 'READY' | 'ERROR'>('IDLE');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen && status === 'IDLE') {
      checkAuthAndStart();
    }
  }, [isOpen]);

  useEffect(() => {
    if (status === 'GENERATING') {
      const interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % (LOADING_MESSAGES.length - 1));
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const checkAuthAndStart = async () => {
    if (typeof window !== 'undefined' && window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setStatus('AUTH_REQUIRED');
      } else {
        startGeneration();
      }
    } else {
      startGeneration();
    }
  };

  const handleSelectKey = async () => {
    if (typeof window !== 'undefined' && window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume selection successful and proceed immediately to mitigate race condition.
      startGeneration();
    }
  };

  const startGeneration = async () => {
    setStatus('GENERATING');
    setProgress(5);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: 'A hyper-realistic 3D cinematic shot of a glowing blue digital document stream flowing through a futuristic AI aperture, floating data points, high-tech financial dashboard in the background, 4k, smooth motion, professional lighting.',
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        setProgress(prev => Math.min(prev + 8, 95));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        // Append API key when fetching from the download link.
        const fetchUrl = `${downloadLink}&key=${process.env.API_KEY}`;
        setVideoUrl(fetchUrl);
        setStatus('READY');
        setProgress(100);
        setLoadingMsgIdx(LOADING_MESSAGES.length - 1);
      } else {
        throw new Error("No video link returned");
      }
    } catch (error: any) {
      console.error("Video Generation Error:", error);
      if (error.message?.includes("Requested entity was not found")) {
        setStatus('AUTH_REQUIRED');
      } else {
        setStatus('ERROR');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="bg-slate-900 w-full max-w-5xl rounded-[40px] shadow-2xl border border-slate-800 overflow-hidden flex flex-col aspect-video relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {status === 'AUTH_REQUIRED' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-8 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-blue-600/20 rounded-[32px] flex items-center justify-center text-4xl shadow-2xl shadow-blue-500/20">🔑</div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">Authorization Required</h2>
              <p className="text-slate-400 max-w-md mx-auto text-sm font-medium leading-relaxed">
                To generate high-fidelity cinematic demos, you must authorize a paid Google Cloud project.
                <br/>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-blue-500 hover:underline">Learn about billing</a>
              </p>
            </div>
            <button 
              onClick={handleSelectKey}
              className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-50 transition-all shadow-xl shadow-white/5 active:scale-95"
            >
              Select API Key
            </button>
          </div>
        )}

        {(status === 'GENERATING' || status === 'IDLE') && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-12 animate-in fade-in">
            <div className="relative">
              <div className="w-32 h-32 border-4 border-blue-500/20 rounded-full animate-spin border-t-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.3)]"></div>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">🎬</div>
            </div>
            
            <div className="space-y-6 text-center w-full max-w-sm">
              <div className="space-y-2">
                <p className="text-white font-black uppercase tracking-[0.2em] text-sm animate-pulse">
                  {LOADING_MESSAGES[loadingMsgIdx]}
                </p>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  Estimated completion: ~90 seconds
                </p>
              </div>
              
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-blue-600 transition-all duration-1000 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {status === 'READY' && videoUrl && (
          <div className="flex-1 bg-black animate-in fade-in duration-1000">
            <video 
              src={videoUrl} 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {status === 'ERROR' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-6">
            <div className="text-6xl">⚠️</div>
            <div className="text-center">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Generation Latency</h3>
              <p className="text-slate-400 text-sm font-medium mt-2">The AI brain is currently overwhelmed. Please try again in a few minutes.</p>
            </div>
            <button onClick={startGeneration} className="text-blue-500 font-black uppercase text-[10px] tracking-widest hover:underline">Retry Synthesis</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoDemoModal;
