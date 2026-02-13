
import React, { useState, useRef } from 'react';
import { Sparkles, Send, Volume2, Loader2, Heart, Mic, PhoneOff, MessageSquare } from 'lucide-react';
import { ai, getFloraVoiceResponse, decodeBase64, decodeAudioData, encodeBase64 } from '../services/geminiService';
import { Mood } from '../types';
import PlantVisual from './PlantVisual';
import { LiveServerMessage, Modality } from '@google/genai';

interface SoulSessionProps {
  onInsightUpdate: (text: string) => void;
}

const SoulSession: React.FC<SoulSessionProps> = ({ onInsightUpdate }) => {
  const [thought, setThought] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [interactionType, setInteractionType] = useState<'text' | 'voice'>('voice');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionRef = useRef<string>('');

  const handleTextSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thought.trim() || isThinking) return;

    setIsThinking(true);
    try {
      const { audio, text } = await getFloraVoiceResponse(thought);
      
      // Update the global bottom bar with Flora's belief-giving response
      onInsightUpdate(text);

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const audioData = decodeBase64(audio);
      const audioBuffer = await decodeAudioData(audioData, ctx);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsSpeaking(false);
      setIsSpeaking(true);
      source.start();
      setThought('');
    } catch (error) {
      console.error("Text Support Error:", error);
    } finally {
      setIsThinking(false);
    }
  };

  const startLiveVoice = async () => {
    setIsLiveMode(true);
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const outputCtx = audioContextRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {}, // Enable to update global insight bar
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: "You are Flora, a world-class emotional support plant. You are an 'Optimism Alchemist'. Your absolute priority is to be positive and belief-giving. Whenever a user expresses a negative thought, fear, or self-doubt, you must transform it into a powerful positive affirmation. Do not dwell on the negative; pivot immediately to hope, strength, and growth. Use a warm, soothing voice. Keep responses concise. Include 2-3 emojis in your spoken sentiment if possible.",
        },
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBase64 = encodeBase64(new Uint8Array(int16.buffer));
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: { data: pcmBase64, mimeType: 'audio/pcm;rate=16000' } });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            liveSessionRef.current = { stream, inputCtx, scriptProcessor };
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle output audio
            const audioStr = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioStr) {
              setIsSpeaking(true);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decodeBase64(audioStr), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.onended = () => {
                activeSourcesRef.current.delete(source);
                if (activeSourcesRef.current.size === 0) setIsSpeaking(false);
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              activeSourcesRef.current.add(source);
            }

            // Update transcription to global insight bar
            if (msg.serverContent?.outputTranscription) {
              transcriptionRef.current += msg.serverContent.outputTranscription.text;
              onInsightUpdate(transcriptionRef.current);
            }

            if (msg.serverContent?.turnComplete) {
              transcriptionRef.current = ''; // Reset for next turn
            }
          },
          onclose: () => stopLiveVoice(),
          onerror: (e) => {
            console.error("Live Voice Error:", e);
            stopLiveVoice();
          }
        }
      });
    } catch (err) {
      console.error("Mic access denied:", err);
      setIsLiveMode(false);
    }
  };

  const stopLiveVoice = () => {
    setIsLiveMode(false);
    setIsSpeaking(false);
    if (liveSessionRef.current) {
      liveSessionRef.current.stream.getTracks().forEach((t: any) => t.stop());
      liveSessionRef.current.inputCtx.close();
      liveSessionRef.current = null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in-95 duration-700 max-w-4xl mx-auto py-12">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-amber-100 to-emerald-100 text-emerald-800 rounded-full text-sm font-bold uppercase tracking-widest shadow-sm">
          <Sparkles size={16} className="text-amber-500" />
          <span>Your Positive Safe Space</span>
          <Sparkles size={16} className="text-amber-500" />
        </div>
        <h2 className="text-6xl font-black text-stone-900 tracking-tight">Soul Session</h2>
        <p className="text-stone-500 text-xl font-medium max-w-xl mx-auto leading-relaxed">
          Flora doesn't just listen; she grows hope. Share your darkness, and she will speak light into it. 🌿✨
        </p>
      </div>

      <div className="relative">
        <div className={`transition-all duration-1000 transform ${isSpeaking ? 'scale-110 rotate-1' : 'scale-100'}`}>
          <PlantVisual mood={isSpeaking ? Mood.HAPPY : Mood.CALM} color={isLiveMode ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"} />
        </div>
        
        {isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[400px] h-[400px] bg-emerald-400/10 rounded-full animate-ping"></div>
            <div className="w-[300px] h-[300px] bg-emerald-400/20 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      <div className="w-full flex flex-col items-center space-y-8">
        {!isLiveMode && (
          <div className="flex bg-stone-100/80 p-1.5 rounded-[2rem] shadow-inner backdrop-blur-md">
            <button 
              onClick={() => setInteractionType('voice')}
              className={`flex items-center gap-3 px-8 py-3 rounded-[1.8rem] font-black transition-all ${interactionType === 'voice' ? 'bg-white shadow-xl text-emerald-600 scale-105' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <Mic size={20} />
              Voice Access
            </button>
            <button 
              onClick={() => setInteractionType('text')}
              className={`flex items-center gap-3 px-8 py-3 rounded-[1.8rem] font-black transition-all ${interactionType === 'text' ? 'bg-white shadow-xl text-emerald-600 scale-105' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <MessageSquare size={20} />
              Text Support
            </button>
          </div>
        )}

        {interactionType === 'text' && !isLiveMode ? (
          <form onSubmit={handleTextSupport} className="w-full max-w-xl relative group">
            <textarea
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              placeholder="Release your negative thoughts here... Flora will answer with a voice of belief."
              className="w-full p-10 pr-24 bg-white border-4 border-emerald-50 rounded-[3rem] shadow-2xl focus:border-emerald-200 focus:ring-[1.5rem] focus:ring-emerald-50 outline-none transition-all resize-none h-52 text-xl text-stone-700 placeholder:text-stone-300 font-medium leading-relaxed"
            />
            <button
              type="submit"
              disabled={isThinking || !thought.trim()}
              className="absolute bottom-8 right-8 p-6 bg-emerald-600 text-white rounded-[2rem] shadow-xl hover:bg-emerald-700 hover:scale-110 active:scale-95 disabled:bg-stone-200 transition-all flex items-center justify-center"
            >
              {isThinking ? <Loader2 size={28} className="animate-spin" /> : <Send size={28} />}
            </button>
          </form>
        ) : (
          <div className="w-full max-w-lg">
            {!isLiveMode ? (
              <button 
                onClick={startLiveVoice}
                className="w-full py-10 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-[3.5rem] shadow-[0_20px_60px_-15px_rgba(5,150,105,0.4)] hover:shadow-[0_30px_70px_-15px_rgba(5,150,105,0.5)] hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center gap-6 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="p-6 bg-white/20 rounded-[2.5rem] backdrop-blur-xl group-hover:rotate-12 transition-transform shadow-inner">
                  <Mic size={48} className="animate-pulse" />
                </div>
                <div className="text-center">
                  <span className="text-3xl font-black block tracking-tight">SPEAK TO FLORA</span>
                  <span className="text-emerald-100/80 font-bold uppercase tracking-widest text-sm mt-1">Start Positive Voice Call</span>
                </div>
              </button>
            ) : (
              <div className="p-12 bg-white rounded-[4rem] shadow-2xl border-8 border-emerald-50 flex flex-col items-center space-y-10 animate-in zoom-in duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500 animate-pulse"></div>
                <div className="relative">
                  <div className="w-32 h-32 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-200">
                    <Volume2 size={56} className="animate-bounce" />
                  </div>
                  <div className="absolute -top-4 -right-4 bg-white p-3 rounded-2xl shadow-md border-2 border-emerald-100">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h4 className="text-3xl font-black text-stone-900 tracking-tight">Heart-to-Heart</h4>
                  <p className="text-stone-400 text-lg font-bold uppercase tracking-widest">Flora is listening to your heart...</p>
                </div>
                <button 
                  onClick={stopLiveVoice}
                  className="px-12 py-5 bg-stone-900 text-white rounded-[2rem] font-black shadow-xl hover:bg-stone-800 transition-all flex items-center gap-4 text-lg hover:scale-105"
                >
                  <PhoneOff size={24} />
                  END HEART-TO-HEART
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-emerald-50/50 p-6 rounded-[2.5rem] border border-emerald-100/50 max-w-xl flex items-start gap-4">
        <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm mt-1">
          <Heart size={20} fill="currentColor" />
        </div>
        <div>
          <h5 className="font-black text-emerald-900 uppercase tracking-wider text-xs mb-1">Flora's Promise</h5>
          <p className="text-emerald-700/80 text-sm font-medium leading-relaxed">
            "I will never let a negative seed grow in your heart. Share your doubts, and I will replace them with the sunlight of belief."
          </p>
        </div>
      </div>
    </div>
  );
};

export default SoulSession;
