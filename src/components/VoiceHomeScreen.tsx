import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Cloud, 
  Droplets, 
  Thermometer, 
  Leaf, 
  Sun, 
  MapPin, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Sparkles,
  ChevronRight,
  HelpCircle,
  X
} from 'lucide-react';
import { healthCheck, getWeatherData, getMultiDayWeather, processVoiceQuery, getWeatherByLocation } from '../services/api';

export function VoiceHomeScreen() {
  // Voice & STT States
  const [isListening, setIsListening] = useState(false);
  const [voiceQueryText, setVoiceQueryText] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [voiceResponse, setVoiceResponse] = useState<any>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Text-to-Speech (TTS) States
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Weather & Location States
  const [weatherData, setWeatherData] = useState<any>(null);
  const [multiDayForecast, setMultiDayForecast] = useState<any[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'granted' | 'denied' | 'locating'>('locating');

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 1. Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

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
  }, [selectedLanguage]);

  // 2. Fetch Hyperlocal GPS Weather & 3-Day Forecast
  const requestLocationAndFetchWeather = () => {
    setLoading(true);
    setLocationStatus('locating');

    if (!navigator.geolocation) {
      setLocationStatus('denied');
      fetchFallbackWeather('New Delhi');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lon: longitude });
        setLocationStatus('granted');
        try {
          await healthCheck();
          const [currentData, multidayData] = await Promise.all([
            getWeatherData(latitude, longitude),
            getMultiDayWeather(latitude, longitude, 4)
          ]);
          setWeatherData(currentData);
          if (multidayData && multidayData.daily_forecast) {
            setMultiDayForecast(multidayData.daily_forecast);
          }
        } catch (err) {
          fetchFallbackWeather('New Delhi');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLocationStatus('denied');
        fetchFallbackWeather('New Delhi');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const fetchFallbackWeather = async (city: string) => {
    try {
      await healthCheck();
      const currentData = await getWeatherByLocation(city);
      setWeatherData(currentData);
      const multidayData = await getMultiDayWeather(28.6139, 77.2090, 4);
      if (multidayData && multidayData.daily_forecast) {
        setMultiDayForecast(multidayData.daily_forecast);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestLocationAndFetchWeather();
  }, []);

  // 3. 1-Tap Mic Interaction
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
        recognitionRef.current.lang = selectedLanguage;
        recognitionRef.current.start();
        return;
      } catch (_) {}
    }

    // MediaRecorder Fallback
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
        .catch(() => {});
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

  // 4. Send Voice Query to Backend
  const submitVoiceQuery = async (params: { textQuery?: string; audioBlob?: Blob }) => {
    setIsProcessingAI(true);
    try {
      const response = await processVoiceQuery({
        textQuery: params.textQuery,
        audioBlob: params.audioBlob,
        lat: coords?.lat,
        lon: coords?.lon,
        language: selectedLanguage.startsWith('hi') ? 'hi' : 'en'
      });

      setVoiceResponse(response);
      if (response.query) {
        setVoiceQueryText(response.query);
      }

      if (response.response_text && !isMuted) {
        speakResponse(response.response_text, response.language || 'hi');
      }
    } catch (err: any) {
      console.error('Voice query error:', err);
    } finally {
      setIsProcessingAI(false);
    }
  };

  // 5. Native Text-to-Speech
  const speakResponse = (text: string, lang: string = 'hi') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-IN' : 'hi-IN';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const replaySpeech = () => {
    if (voiceResponse?.response_text) {
      speakResponse(voiceResponse.response_text, voiceResponse.language || 'hi');
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-emerald-50/70 via-amber-50/40 to-green-100/60 p-5 pb-24 flex flex-col justify-between">
      <div>
        {/* Sleek Mobile Header */}
        <div className="flex items-center justify-between pt-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-md">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-emerald-950 font-black text-xl leading-tight">FarmWhisper</h1>
              <p className="text-emerald-700 text-xs font-semibold">खेती का सच्चा साथी • AI कृषि मित्र</p>
            </div>
          </div>

          {/* Language Switcher Pill */}
          <div className="flex bg-white/90 p-1 rounded-2xl border border-emerald-200 shadow-sm text-xs font-bold">
            <button
              onClick={() => setSelectedLanguage('hi-IN')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedLanguage === 'hi-IN' 
                  ? 'bg-emerald-700 text-white shadow-sm' 
                  : 'text-emerald-800'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setSelectedLanguage('en-IN')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedLanguage === 'en-IN' 
                  ? 'bg-emerald-700 text-white shadow-sm' 
                  : 'text-emerald-800'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Clean Location Chip */}
        <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-2xl px-3.5 py-2 border border-emerald-100 shadow-sm mb-5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-bold text-emerald-950 truncate">
              {weatherData?.location || (locationStatus === 'locating' ? 'स्थान खोजा जा रहा है...' : 'स्थान: New Delhi')}
            </span>
          </div>
          <button
            onClick={requestLocationAndFetchWeather}
            title="रीफ्रेश"
            disabled={loading}
            className="text-emerald-700 hover:text-emerald-900 p-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Central Hero Voice Assistant (1-Tap Experience) */}
        <div className="flex flex-col items-center my-6">
          <div className="relative flex items-center justify-center">
            {/* Fluid Ripple Waves when listening */}
            <AnimatePresence>
              {isListening && (
                <>
                  <motion.div
                    className="absolute w-44 h-44 rounded-full border-4 border-emerald-400 opacity-40 pointer-events-none"
                    initial={{ scale: 0.9, opacity: 0.6 }}
                    animate={{ scale: [1, 1.5, 1.5], opacity: [0.6, 0, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                  <motion.div
                    className="absolute w-44 h-44 rounded-full border-4 border-amber-400 opacity-40 pointer-events-none"
                    initial={{ scale: 0.9, opacity: 0.6 }}
                    animate={{ scale: [1, 1.5, 1.5], opacity: [0.6, 0, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
                  />
                </>
              )}
            </AnimatePresence>

            <motion.button
              onClick={toggleListening}
              className={`relative z-10 w-36 h-36 rounded-full shadow-2xl flex flex-col items-center justify-center transition-all ${
                isListening 
                  ? 'bg-gradient-to-br from-red-500 to-red-700 text-white ring-8 ring-red-200' 
                  : isProcessingAI
                  ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white ring-8 ring-amber-200'
                  : 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-800 text-white ring-8 ring-emerald-100 hover:scale-105 active:scale-95'
              }`}
              whileTap={{ scale: 0.94 }}
            >
              {isListening ? (
                <>
                  <MicOff className="w-14 h-14 mb-1 animate-pulse" />
                  <span className="text-[10px] font-extrabold tracking-wider uppercase">रोकें (Stop)</span>
                </>
              ) : isProcessingAI ? (
                <>
                  <RefreshCw className="w-12 h-12 mb-1 animate-spin" />
                  <span className="text-[10px] font-extrabold">AI सोच रहा है...</span>
                </>
              ) : (
                <>
                  <Mic className="w-14 h-14 mb-1" />
                  <span className="text-[10px] font-extrabold tracking-wider uppercase">टैप करें और बोलें</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Live Listening Text */}
          {isListening && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 bg-red-50 text-red-900 border border-red-200 px-4 py-1.5 rounded-full text-center text-xs font-bold shadow-sm"
            >
              <p className="animate-pulse">🎤 {voiceQueryText || 'आपकी आवाज़ सुनी जा रही है...'}</p>
            </motion.div>
          )}

          {!isListening && !isProcessingAI && !voiceResponse && (
            <p className="mt-3 text-emerald-900 font-bold text-xs text-center tracking-wide">
              {selectedLanguage === 'hi-IN' ? 'माइक दबाकर मौसम या फसल का सवाल पूछें' : 'Tap mic to ask about weather or crop remedies'}
            </p>
          )}
        </div>

        {/* AI Spoken Response Card */}
        <AnimatePresence>
          {voiceResponse && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/95 backdrop-blur-md rounded-3xl p-4 mb-4 shadow-xl border border-emerald-300 relative"
            >
              <button
                onClick={() => setVoiceResponse(null)}
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-2 pr-6">
                <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <h3 className="font-bold text-emerald-950 text-xs">FarmWhisper AI उत्तर:</h3>
              </div>

              {/* User Query */}
              {voiceResponse.query && (
                <p className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl mb-2 font-semibold">
                  "{voiceResponse.query}"
                </p>
              )}

              {/* Spoken Response */}
              <p className="text-xs text-gray-900 leading-relaxed font-medium mb-3">
                {voiceResponse.response_text}
              </p>

              {/* TTS Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                <button
                  onClick={isSpeaking ? stopSpeaking : replaySpeech}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-900 rounded-full font-bold active:scale-95 transition-all"
                >
                  {isSpeaking ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isSpeaking ? 'आवाज़ रोकें' : 'दोबारा सुनें'}</span>
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-1.5 rounded-full ${isMuted ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-100'}`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Voice Chips (Minimal Pill Style) */}
        {!voiceResponse && (
          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                "आज का मौसम?",
                "क्या कल बारिश होगी?",
                "गेहूं में सिंचाई कब करें?",
                "माहू कीट की दवा बताएं"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => submitVoiceQuery({ textQuery: chip })}
                  className="bg-white/90 hover:bg-white text-emerald-950 text-[11px] font-bold px-3 py-2 rounded-2xl border border-emerald-200 shadow-sm whitespace-nowrap active:scale-95 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Unified iOS-Style Weather & 3-Day Forecast Widget */}
        <div className="bg-white/95 rounded-3xl p-4 shadow-lg border border-amber-200/80 mb-3">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Cloud className="w-5 h-5 text-blue-500" />
              <h3 className="text-emerald-950 font-bold text-xs">आज का मौसम व 3-दिन का पूर्वानुमान</h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-800">
              {weatherData ? `${Math.round(weatherData.temperature || 28)}°C` : '--'}
            </span>
          </div>

          {/* Current Metrics Pills */}
          {weatherData && (
            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div className="bg-blue-50/70 p-2 rounded-2xl border border-blue-100">
                <p className="text-[10px] text-blue-800 font-semibold">बारिश</p>
                <p className="text-xs font-black text-blue-950">{Math.round(weatherData.rain_probability || 0)}%</p>
              </div>
              <div className="bg-orange-50/70 p-2 rounded-2xl border border-orange-100">
                <p className="text-[10px] text-orange-800 font-semibold">तापमान</p>
                <p className="text-xs font-black text-orange-950">{Math.round(weatherData.temperature || 0)}°C</p>
              </div>
              <div className="bg-amber-50/70 p-2 rounded-2xl border border-amber-100">
                <p className="text-[10px] text-amber-800 font-semibold">नमी</p>
                <p className="text-xs font-black text-amber-950">{Math.round(weatherData.humidity || 0)}%</p>
              </div>
            </div>
          )}

          {/* 3-Day Forecast Grid (Compact) */}
          {multiDayForecast.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-gray-100">
              {multiDayForecast.slice(0, 4).map((d, i) => (
                <div key={i} className={`p-1.5 rounded-xl text-center ${i === 0 ? 'bg-emerald-50 text-emerald-950 font-bold' : 'bg-gray-50'}`}>
                  <p className="text-[9px] font-bold">{i === 0 ? 'आज' : i === 1 ? 'कल' : i === 2 ? 'परसों' : '+3 दिन'}</p>
                  <p className="text-[10px] font-black my-0.5">{Math.round(d.temp_max)}°</p>
                  <p className="text-[8px] text-blue-700 font-bold">💧{Math.round(d.rain_probability)}%</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Minimal Footer Crop Health Indicator */}
      <div className="bg-gradient-to-r from-emerald-700 to-green-800 text-white rounded-2xl px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-bold">
        <span>🌾 फसल स्थिति: धान - स्वस्थ</span>
        <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px]">🟢 सामान्य</span>
      </div>
    </div>
  );
}