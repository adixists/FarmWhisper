import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Cloud, Droplets, Thermometer, Leaf, Wind, Volume2, Pause, Sparkles, X, CloudRain } from 'lucide-react';
import { healthCheck, getWeatherData, getWeatherByLocation, processVoiceQuery } from '../services/api';
import { LeavesBackground } from './LeavesBackground';

export function VoiceHomeScreen() {
  const [isListening, setIsListening] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Voice Query & TTS States
  const [voiceQueryText, setVoiceQueryText] = useState<string>('');
  const [voiceResponse, setVoiceResponse] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 1. Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceQueryText('');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setVoiceQueryText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  // 2. Fetch live weather on mount with GPS permission
  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true);
      setError(null);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            setCoords({ lat: latitude, lon: longitude });
            try {
              await healthCheck();
              const data = await getWeatherData(latitude, longitude);
              setWeatherData(data);
            } catch (err) {
              fetchFallbackWeather();
            } finally {
              setLoading(false);
            }
          },
          () => {
            fetchFallbackWeather();
          },
          { timeout: 8000 }
        );
      } else {
        fetchFallbackWeather();
      }
    };

    const fetchFallbackWeather = async () => {
      try {
        await healthCheck();
        const data = await getWeatherByLocation('New Delhi');
        setWeatherData(data);
      } catch (err) {
        console.error('Error fetching weather data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

  // 3. Mic Click Handler
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    stopSpeaking();
    setVoiceResponse(null);
    setVoiceQueryText('');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        return;
      } catch (_) {}
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            submitVoiceQuery({ audioBlob });
            stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsListening(true);
        })
        .catch(() => {
          setError("माइक की अनुमति नहीं मिली। (Microphone access denied)");
        });
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      return;
    }
    if (voiceQueryText.trim()) {
      submitVoiceQuery({ textQuery: voiceQueryText });
    }
  };

  // 4. Submit Query to Backend & Speak Response
  const submitVoiceQuery = async (params: { textQuery?: string; audioBlob?: Blob }) => {
    setIsProcessing(true);
    try {
      const res = await processVoiceQuery({
        textQuery: params.textQuery,
        audioBlob: params.audioBlob,
        lat: coords?.lat,
        lon: coords?.lon,
        language: 'hi'
      });
      setVoiceResponse(res);
      if (res.response_text) {
        speakResponse(res.response_text);
      }
    } catch (e) {
      console.error('Voice processing error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Speech Synthesis (TTS)
  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  return (
    <div className="min-h-full relative overflow-hidden flex flex-col p-6 pb-24">
      {/* Live Wallpaper Background */}
      <LeavesBackground />

      {/* Main Content Container (z-10 to stay above background) */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="text-center mb-8 pt-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="bg-green-600/10 p-2.5 rounded-2xl">
              <Leaf className="w-7 h-7 text-green-600 fill-green-600" />
            </div>
          </div>
          <h1 className="text-green-950 mb-1 font-black text-3xl tracking-tight leading-none">FarmWhisper</h1>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200/60">
              🌱 खेती का सच्चा साथी
            </span>
          </div>
        </div>

        {/* Status messages */}
        {loading && (
          <div className="text-center mb-4 text-green-700 text-sm font-medium">
            मौसम जानकारी लोड हो रही है...
          </div>
        )}
        
        {error && (
          <div className="text-center mb-4 text-red-500 bg-red-50 p-3 rounded-2xl text-sm font-medium border border-red-100 shadow-sm">
            {error}
          </div>
        )}

        {/* Voice Assistant Button Area */}
        <div className="flex-1 flex flex-col items-center justify-center mb-10">
          <motion.button
            onClick={toggleListening}
            className="relative w-44 h-44 rounded-full flex items-center justify-center transition-all group"
            style={{
              background: isListening
                ? 'linear-gradient(145deg, #ef4444 0%, #b91c1c 100%)'
                : isProcessing
                ? 'linear-gradient(145deg, #f59e0b 0%, #b45309 100%)'
                : 'linear-gradient(145deg, #2D6A4F 0%, #1B4332 100%)',
              boxShadow: isListening
                ? '0 8px 32px rgba(185,28,28,0.45), 0 2px 8px rgba(0,0,0,0.2)'
                : isProcessing
                ? '0 8px 32px rgba(180,83,9,0.45), 0 2px 8px rgba(0,0,0,0.2)'
                : '0 8px 32px rgba(27,67,50,0.5), 0 2px 8px rgba(0,0,0,0.2)',
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.93 }}
            animate={isListening ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
          >
            {/* Concentric rings for aesthetics */}
            <div className="absolute inset-0 rounded-full border-2 border-white/15 scale-110"></div>
            <div className="absolute inset-2 rounded-full border border-white/40 group-hover:border-white/60 transition-colors"></div>
            <div className="absolute inset-5 rounded-full border border-white/25"></div>
            <div className="absolute inset-9 rounded-full border border-white/15"></div>
            
            <Mic className="w-20 h-20 text-white drop-shadow-md z-10" />
            
            {/* Animated Waves */}
            {isListening && (
              <>
                <motion.div
                  className="absolute w-48 h-48 rounded-full border-4 border-white opacity-40 pointer-events-none"
                  animate={{ scale: [1, 1.6, 1.6], opacity: [0.4, 0, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <motion.div
                  className="absolute w-48 h-48 rounded-full border-4 border-white opacity-40 pointer-events-none"
                  animate={{ scale: [1, 1.6, 1.6], opacity: [0.4, 0, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
                />
              </>
            )}
          </motion.button>
          
          <p className="mt-8 text-green-950 font-black text-lg tracking-wide drop-shadow-sm">
            {isListening ? 'सुन रहा हूँ... बोलिए' : isProcessing ? 'AI सोच रहा है...' : 'पूछें FarmWhisper से'}
          </p>

          {isListening && voiceQueryText && (
            <p className="text-sm text-green-800 mt-3 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full font-medium shadow-sm border border-white/50">
              "{voiceQueryText}"
            </p>
          )}
        </div>

        {/* Voice Response Card (Appears cleanly when answer is received) */}
        <AnimatePresence>
          {voiceResponse && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 mb-8 shadow-2xl border border-white relative z-20"
            >
              <button
                onClick={() => setVoiceResponse(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full p-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-3">
                <div className="bg-amber-100 p-1.5 rounded-xl">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="font-bold text-green-950 text-base">FarmWhisper उत्तर:</h3>
              </div>

              <p className="text-sm text-slate-700 font-medium leading-relaxed mb-4">
                {voiceResponse.response_text}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={isSpeaking ? stopSpeaking : () => speakResponse(voiceResponse.response_text)}
                  className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-xl transition-colors"
                >
                  {isSpeaking ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>{isSpeaking ? 'आवाज़ रोकें' : 'दोबारा सुनें'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Weather Card */}
        <div className="bg-[#F8F9FA]/90 backdrop-blur-md rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 border border-white">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-slate-800 font-black text-lg">आज का मौसम</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                📍 {weatherData?.location || 'स्थानीय मौसम'}
              </p>
            </div>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Cloud className="w-5 h-5 text-blue-500 fill-blue-100" />
            </div>
          </div>
          
          {weatherData ? (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {/* Rain - Blue tinted tile */}
              <div
                className="flex flex-col items-center rounded-2xl p-3.5 border border-blue-100"
                style={{ background: 'linear-gradient(145deg, #dbeafe 0%, #bfdbfe 100%)' }}
              >
                <CloudRain className="w-5 h-5 text-blue-600 mb-1.5" />
                <p className="text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-0.5">बारिश</p>
                <p className="text-blue-900 font-black text-lg leading-none">{Math.round(weatherData.rain_probability || 0)}%</p>
              </div>

              {/* Temperature - Warm red/orange tile */}
              <div
                className="flex flex-col items-center rounded-2xl p-3.5 border border-orange-100"
                style={{ background: 'linear-gradient(145deg, #fed7aa 0%, #fdba74 100%)' }}
              >
                <Thermometer className="w-5 h-5 text-orange-700 mb-1.5" />
                <p className="text-orange-700 text-[10px] font-bold uppercase tracking-wider mb-0.5">तापमान</p>
                <p className="text-orange-900 font-black text-lg leading-none">{Math.round(weatherData.temperature || 0)}°C</p>
              </div>

              {/* Humidity - Golden/amber tile */}
              <div
                className="flex flex-col items-center rounded-2xl p-3.5 border border-yellow-100"
                style={{ background: 'linear-gradient(145deg, #fef9c3 0%, #fde68a 100%)' }}
              >
                <Wind className="w-5 h-5 text-yellow-700 mb-1.5" />
                <p className="text-yellow-700 text-[10px] font-bold uppercase tracking-wider mb-0.5">आर्द्रता</p>
                <p className="text-yellow-900 font-black text-lg leading-none">{Math.round(weatherData.humidity || 0)}%</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-6 text-sm font-medium">
              मौसम डेटा लोड हो रहा है...
            </div>
          )}

          {/* Toggle for Crop Reports */}
          <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">Current Crop Reports</span>
            <div className="w-12 h-6 bg-green-500 rounded-full relative shadow-inner cursor-pointer flex items-center px-1">
              <motion.div className="w-4 h-4 bg-white rounded-full shadow-sm" layout transition={{ type: "spring", stiffness: 700, damping: 30 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}