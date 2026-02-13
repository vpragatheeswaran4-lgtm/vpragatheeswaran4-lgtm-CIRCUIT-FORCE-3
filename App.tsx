
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  Wind, 
  Droplets, 
  Thermometer, 
  AlertTriangle, 
  Activity, 
  CloudRain,
  MessageCircle,
  RefreshCw,
  Heart,
  TrendingUp,
  Camera,
  X,
  Check,
  LayoutDashboard,
  Sprout,
  Sparkles,
  Zap,
  Quote
} from 'lucide-react';

import { SensorData, Mood } from './types';
import { SENSOR_THRESHOLDS, MOOD_MAP } from './constants';
import { getPlantInsights } from './services/geminiService';
import SensorCard from './components/SensorCard';
import PlantVisual from './components/PlantVisual';
import SoulSession from './components/SoulSession';

const INITIAL_HISTORY = Array.from({ length: 12 }, (_, i) => ({
  time: `${i + 8}:00`,
  aqi: Math.floor(Math.random() * 40) + 20,
  moisture: Math.floor(Math.random() * 30) + 50,
}));

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'soul'>('dashboard');
  const [data, setData] = useState<SensorData>({
    airQuality: 22,
    harmfulGas: 12,
    soilMoisture: 65,
    vibration: 2,
    temperature: 24.5,
    humidity: 52,
    timestamp: new Date(),
  });

  const [history] = useState(INITIAL_HISTORY);
  const [mood, setMood] = useState<Mood>(Mood.HAPPY);
  const [aiInsight, setAiInsight] = useState<string>("Tuning into your frequencies...");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const determineMood = (s: SensorData): Mood => {
    if (s.harmfulGas > SENSOR_THRESHOLDS.GAS_DANGER) return Mood.SCARED;
    if (s.airQuality > SENSOR_THRESHOLDS.AIR_POLLUTED) return Mood.SICK;
    if (s.soilMoisture < SENSOR_THRESHOLDS.SOIL_DRY) return Mood.THIRSTY;
    if (s.vibration > SENSOR_THRESHOLDS.VIBRATION_STRESS) return Mood.STRESSED;
    if (s.airQuality < 30 && s.soilMoisture > 50) return Mood.HAPPY;
    return Mood.CALM;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newData = {
          ...prev,
          airQuality: Math.max(0, Math.min(100, prev.airQuality + (Math.random() * 4 - 2))),
          harmfulGas: Math.max(0, prev.harmfulGas + (Math.random() * 6 - 3)),
          soilMoisture: Math.max(0, prev.soilMoisture - 0.05),
          vibration: Math.max(0, Math.min(10, prev.vibration + (Math.random() * 2 - 1))),
          timestamp: new Date(),
        };
        setMood(determineMood(newData));
        return newData;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchInsights = useCallback(async (image?: string) => {
    setIsRefreshing(true);
    const insight = await getPlantInsights(data, mood, image);
    setAiInsight(insight);
    setIsRefreshing(false);
  }, [data, mood]);

  useEffect(() => {
    fetchInsights();
  }, []);

  const openCamera = async () => {
    setIsCameraOpen(true);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsCameraOpen(false);
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOpen(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
      }
    }
  };

  const analyzePhoto = () => {
    if (capturedImage) {
      fetchInsights(capturedImage);
      closeCamera();
    }
  };

  const activeMood = MOOD_MAP[mood];

  const getSentimentFlair = () => {
    switch(mood) {
      case Mood.HAPPY: return "✨🌟🌻";
      case Mood.THIRSTY: return "💧🌱🙏";
      case Mood.SICK: return "☀️🛡️🌿";
      case Mood.SCARED: return "🛡️💖🌱";
      case Mood.STRESSED: return "🌊🌬️✨";
      case Mood.CALM: return "🧘‍♂️🍃☁️";
      default: return "✨";
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-stone-100 pb-10">
        <div className="flex items-center space-x-6">
          <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-200 animate-float">
            <Heart size={40} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-6xl font-black text-stone-900 tracking-tighter">FloraSoul</h1>
            <p className="text-stone-400 font-black text-lg uppercase tracking-[0.2em] text-xs md:text-sm mt-1">Your Emotional Safe Harbor & Eco-Guardian</p>
          </div>
        </div>
        
        <div className="flex bg-stone-100/80 p-2 rounded-[2.8rem] shadow-inner backdrop-blur-md">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-3 px-10 py-5 rounded-[2.5rem] font-black transition-all ${activeTab === 'dashboard' ? 'bg-white text-emerald-600 shadow-2xl scale-110' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <LayoutDashboard size={24} />
            <span>DASHBOARD</span>
          </button>
          <button 
            onClick={() => setActiveTab('soul')}
            className={`flex items-center space-x-3 px-10 py-5 rounded-[2.5rem] font-black transition-all ${activeTab === 'soul' ? 'bg-white text-amber-600 shadow-2xl scale-110' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <Sprout size={24} />
            <span>SOUL SESSION</span>
          </button>
        </div>
      </header>

      {activeTab === 'dashboard' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom duration-1000 pb-12">
          {/* Dashboard Left */}
          <div className="lg:col-span-4 space-y-10">
            <div className="relative group">
              <PlantVisual mood={mood} color={activeMood.color} />
              <button 
                onClick={openCamera}
                className="absolute bottom-10 right-10 p-6 bg-emerald-600 text-white rounded-[2.2rem] shadow-[0_20px_40px_-10px_rgba(5,150,105,0.4)] hover:scale-110 active:scale-90 transition-all flex items-center space-x-3 font-black tracking-tight"
              >
                <Camera size={28} />
                <span>HEALTH SCAN</span>
              </button>
            </div>
          </div>

          {/* Dashboard Right */}
          <div className="lg:col-span-8 space-y-10">
            <div className={`p-12 rounded-[4rem] flex flex-col md:flex-row items-center justify-between transition-all duration-1000 border-4 ${activeMood.color} border-current/10 shadow-2xl relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-12 opacity-5 scale-150">
                <Sparkles size={100} />
              </div>
              <div className="flex items-center space-x-10 relative z-10">
                <span className="text-9xl filter drop-shadow-xl">{activeMood.emoji}</span>
                <div>
                  <p className="font-black text-5xl uppercase tracking-tighter mb-2">Flora: {activeMood.mood}</p>
                  <p className="text-2xl opacity-90 font-bold leading-tight">{activeMood.message}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <SensorCard label="Air Quality" value={Math.round(data.airQuality)} unit="AQI" icon={<Wind size={24} />} colorClass="bg-blue-100/50 text-blue-700 shadow-sm" />
              <SensorCard label="Toxic Gas" value={Math.round(data.harmfulGas)} unit="PPM" icon={<AlertTriangle size={24} />} colorClass="bg-rose-100/50 text-rose-700 shadow-sm" />
              <SensorCard label="Hydration" value={Math.round(data.soilMoisture)} unit="%" icon={<Droplets size={24} />} colorClass="bg-cyan-100/50 text-cyan-700 shadow-sm" />
              <SensorCard label="Activity" value={Math.round(data.vibration)} unit="LVL" icon={<Activity size={24} />} colorClass="bg-purple-100/50 text-purple-700 shadow-sm" />
              <SensorCard label="Climate" value={data.temperature.toFixed(1)} unit="°C" icon={<Thermometer size={24} />} colorClass="bg-orange-100/50 text-orange-700 shadow-sm" />
              <SensorCard label="Moisture" value={Math.round(data.humidity)} unit="%" icon={<CloudRain size={24} />} colorClass="bg-indigo-100/50 text-indigo-700 shadow-sm" />
            </div>

            <div className="p-12 bg-white border border-stone-100 rounded-[4rem] shadow-2xl relative overflow-hidden group mb-10">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-3xl font-black text-stone-900 flex items-center gap-4 tracking-tight">
                  <TrendingUp size={36} className="text-emerald-500" />
                  Eco-Health Pulse
                </h3>
              </div>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorAir" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorSoil" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 14, fontWeight: 800}} />
                    <YAxis hide />
                    <Tooltip contentStyle={{borderRadius: '32px', border: 'none', padding: '24px', boxShadow: '0 25px 60px -12px rgb(0 0 0 / 0.2)'}} />
                    <Area type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={6} fill="url(#colorAir)" />
                    <Area type="monotone" dataKey="moisture" stroke="#10b981" strokeWidth={6} fill="url(#colorSoil)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* COMPACT DASHBOARD INSIGHT BOX */}
            <div className="bg-white/90 backdrop-blur-xl border-2 border-emerald-50 shadow-xl rounded-[3rem] p-6 flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-bottom duration-700 relative overflow-hidden group">
              <div className="flex-shrink-0 p-4 bg-emerald-600 text-white rounded-[1.5rem] shadow-lg relative">
                <MessageCircle size={28} />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              
              <div className="flex-1">
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mb-1 flex items-center gap-1.5">
                  <Zap size={10} fill="currentColor" />
                  Flora's Insight
                </h4>
                <div className="flex items-start gap-2">
                  <Quote size={16} className="text-emerald-100 mt-1 flex-shrink-0" />
                  <p className="text-stone-800 text-lg font-bold leading-tight tracking-tight italic">
                    {aiInsight} <span className="inline-block ml-1 text-2xl">{getSentimentFlair()}</span>
                  </p>
                </div>
              </div>

              <button 
                onClick={() => fetchInsights()}
                disabled={isRefreshing}
                className="p-4 bg-stone-900 text-white rounded-[1.5rem] hover:bg-emerald-600 transition-all disabled:opacity-50"
              >
                <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <SoulSession onInsightUpdate={setAiInsight} />
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-3xl overflow-hidden shadow-[0_0_150px_rgba(0,0,0,0.7)] rounded-[4.5rem] relative border-8 border-white/30">
            <div className="p-10 border-b border-stone-50 flex items-center justify-between bg-stone-50/50">
              <h3 className="text-3xl font-black text-stone-900 tracking-tighter uppercase">Leaf-Vitals Scan</h3>
              <button onClick={closeCamera} className="p-5 text-stone-400 hover:text-rose-500 bg-white rounded-[2rem] shadow-md hover:rotate-90 transition-all">
                <X size={36} />
              </button>
            </div>
            <div className="relative aspect-video bg-stone-100 group">
              {!capturedImage ? (
                <>
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-80 h-80 border-[12px] border-emerald-400/20 rounded-full animate-[ping_4s_infinite]"></div>
                    <div className="w-72 h-72 border-4 border-white/50 rounded-[4rem] animate-pulse"></div>
                  </div>
                </>
              ) : (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="p-12 flex justify-center space-x-10 bg-stone-50/50">
              {!capturedImage ? (
                <button onClick={capturePhoto} className="px-20 py-7 bg-emerald-600 text-white font-black rounded-[2.8rem] shadow-2xl hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all flex items-center space-x-5 text-2xl">
                  <Camera size={40} />
                  <span>PERFORM SCAN</span>
                </button>
              ) : (
                <>
                  <button onClick={() => setCapturedImage(null)} className="px-14 py-7 bg-stone-200 text-stone-700 font-black rounded-[2.2rem] hover:bg-stone-300 transition-all text-xl">RETAKE</button>
                  <button onClick={analyzePhoto} className="px-14 py-7 bg-emerald-600 text-white font-black rounded-[2.2rem] shadow-2xl flex items-center space-x-5 text-xl">
                    <Check size={44} />
                    <span>ANALYZE</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
