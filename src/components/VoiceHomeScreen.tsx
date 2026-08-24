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
  AlertCircle, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles,
  Calendar,
  ChevronRight,
  HelpCircle
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

  // Weather & Geolocation States
  const [weatherData, setWeatherData] = useState<any>(null);
  const [multiDayForecast, setMultiDayForecast] = useState<any[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        console.warn('Speech recognition event error:', event.error);
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

  // 2. Request Geolocation & Fetch Hyperlocal + 3-Day Forecast
  const requestLocationAndFetchWeather = () => {
    setLoading(true);
    setError(null);
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
          console.error("Error fetching GPS weather data:", err);
          fetchFallbackWeather('New Delhi');
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        console.warn("Geolocation permission denied or timed out:", geoError.message);
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
    } catch (err) {
      setError('मौसम सेवा से जुड़ने में असमर्थ।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestLocationAndFetchWeather();
  }, []);

  // 3. Start / Stop Mic Listening
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
      } catch (err) {
        console.warn('Speech recognition start failed, using audio fallback:', err);
      }
    }

    // Fallback: Audio recording via MediaRecorder
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
        .catch((err) => {
          console.error('Mic access denied:', err);
          setError('माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में अनुमति दें।');
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

    // If we have text from Web Speech, submit it
    if (voiceQueryText.trim()) {
      submitVoiceQuery({ textQuery: voiceQueryText });
    }
  };

  // 4. Send Voice Query to Backend Gemini NLP
  const submitVoiceQuery = async (params: { textQuery?: string; audioBlob?: Blob }) => {
    setIsProcessingAI(true);
    setError(null);
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

      // Automatically speak out the response via TTS
      if (response.response_text && !isMuted) {
        speakResponse(response.response_text, response.language || 'hi');
      }
    } catch (err: any) {
      console.error('Error submitting voice query:', err);
      setError(err?.message || 'प्रश्न का उत्तर प्राप्त करने में समस्या।');
    } finally {
      setIsProcessingAI(false);
    }
  };

  // 5. Text-to-Speech (TTS) Handler
  const speakResponse = (text: string, lang: string = 'hi') => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-IN' : 'hi-IN';
    utterance.rate = 0.95; // Natural pace for farmers

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const replaySpeech = () => {
    if (voiceResponse?.response_text) {
      speakResponse(voiceResponse.response_text, voiceResponse.language || 'hi');
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-green-50 via-amber-50 to-green-100 p-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-green-700 flex items-center justify-center text-white shadow-md">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-green-950 font-black text-xl leading-tight">FarmWhisper</h1>
            <p className="text-green-700 text-xs font-semibold">खेती का सच्चा साथी • AI Voice Assistant</p>
          </div>
        </div>

        {/* Language Selector Toggle */}
        <div className="flex bg-white/90 p-1 rounded-2xl border border-green-200 shadow-sm text-xs font-bold">
          <button
            onClick={() => setSelectedLanguage('hi-IN')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              selectedLanguage === 'hi-IN' 
                ? 'bg-green-700 text-white shadow-sm' 
                : 'text-green-800 hover:text-green-950'
            }`}
          >
            हिन्दी
          </button>
          <button
            onClick={() => setSelectedLanguage('en-IN')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              selectedLanguage === 'en-IN' 
                ? 'bg-green-700 text-white shadow-sm' 
                : 'text-green-800 hover:text-green-950'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Location Status Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-green-200 shadow-sm">
          <div className="flex items-center gap-2 overflow-hidden">
            <MapPin className={`w-4 h-4 flex-shrink-0 ${locationStatus === 'granted' ? 'text-green-600' : 'text-amber-600'}`} />
            <span className="text-xs font-bold text-green-950 truncate">
              {weatherData?.location || (locationStatus === 'locating' ? 'स्थान खोजा जा रहा है...' : 'स्थान: New Delhi')}
            </span>
          </div>
          <button
            onClick={requestLocationAndFetchWeather}
            title="स्थान और मौसम रीफ्रेश करें"
            disabled={loading}
            className="flex items-center gap-1 text-[11px] font-bold text-green-700 hover:text-green-900 bg-green-100/70 hover:bg-green-200/70 px-2.5 py-1 rounded-xl transition-colors ml-2 flex-shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>अपडेट</span>
          </button>
        </div>
        
        {locationStatus === 'denied' && (
          <p className="text-[11px] text-amber-800 bg-amber-50/90 px-3 py-1.5 rounded-xl mt-1.5 border border-amber-200 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
            <span>सटीक मौसम व सलाह के लिए स्थान (Location) की अनुमति दें।</span>
          </p>
        )}
      </div>

      {/* Interactive Microphone Section (STT) */}
      <div className="flex flex-col items-center mb-6 pt-2">
        <div className="relative flex items-center justify-center">
          {/* Animated sound waves when recording / listening */}
          <AnimatePresence>
            {isListening && (
              <>
                <motion.div
                  className="absolute w-44 h-44 rounded-full border-4 border-green-400 opacity-40 pointer-events-none"
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
                : 'bg-gradient-to-br from-green-600 to-green-800 text-white ring-8 ring-green-100 hover:scale-105 active:scale-95'
            }`}
            whileTap={{ scale: 0.94 }}
          >
            {isListening ? (
              <>
                <MicOff className="w-14 h-14 mb-1 animate-pulse" />
                <span className="text-[11px] font-bold tracking-wider uppercase">रोकें (Stop)</span>
              </>
            ) : isProcessingAI ? (
              <>
                <RefreshCw className="w-12 h-12 mb-1 animate-spin" />
                <span className="text-[11px] font-bold">AI सोच रहा है...</span>
              </>
            ) : (
              <>
                <Mic className="w-14 h-14 mb-1" />
                <span className="text-[11px] font-bold tracking-wider uppercase">बोलें (Tap to Speak)</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Live Listening Transcript Display */}
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-red-50 text-red-900 border border-red-200 px-4 py-2 rounded-2xl text-center text-xs font-semibold max-w-xs shadow-sm"
          >
            <p className="animate-pulse">🎤 {voiceQueryText || 'आपकी आवाज़ सुनी जा रही है... बोलिए'}</p>
          </motion.div>
        )}

        {!isListening && !isProcessingAI && !voiceResponse && (
          <p className="mt-3 text-green-900 font-bold text-sm text-center">
            {selectedLanguage === 'hi-IN' ? 'माइक दबाएं और मौसम या फसल का सवाल पूछें' : 'Tap mic to ask about weather or crop remedies'}
          </p>
        )}
      </div>

      {/* Voice AI Response Card with TTS Audio Controls */}
      <AnimatePresence>
        {voiceResponse && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl p-5 mb-5 shadow-xl border-2 border-green-300"
          >
            <div className="flex items-start justify-between mb-3 border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-green-950 text-sm">FarmWhisper AI उत्तर</h3>
              </div>

              {/* TTS Audio Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={isSpeaking ? stopSpeaking : replaySpeech}
                  className="p-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-full transition-colors"
                  title={isSpeaking ? "आवाज़ रोकें (Pause)" : "दोबारा सुनें (Replay)"}
                >
                  {isSpeaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2 rounded-full transition-colors ${
                    isMuted ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={isMuted ? "म्यूट हटाएं (Unmute)" : "म्यूट करें (Mute)"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* User Question */}
            {voiceResponse.query && (
              <div className="bg-green-50/70 rounded-xl px-3 py-2 mb-3 text-xs text-green-900 font-medium">
                <span className="font-bold">आपका सवाल: </span>"{voiceResponse.query}"
              </div>
            )}

            {/* AI Spoken Text */}
            <div className="text-sm text-green-950 leading-relaxed font-medium mb-3">
              {voiceResponse.response_text}
            </div>

            {/* Audio Wave Indicator while speaking */}
            {isSpeaking && (
              <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold bg-green-50 p-2 rounded-xl">
                <Volume2 className="w-4 h-4 animate-bounce text-green-600" />
                <span>आवाज़ में पढ़कर सुनाया जा रहा है...</span>
              </div>
            )}

            {/* Action Recommendations */}
            {voiceResponse.recommendations && voiceResponse.recommendations.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-100">
                <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500 mb-1.5">कृषि सलाह (Tips):</p>
                <div className="space-y-1">
                  {voiceResponse.recommendations.map((tip: string, idx: number) => (
                    <div key={idx} className="text-xs text-green-800 flex items-start gap-1.5">
                      <span className="text-green-600 font-bold">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Voice Suggestions */}
      {!voiceResponse && (
        <div className="mb-5">
          <p className="text-xs font-bold text-green-900 mb-2 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-green-700" />
            <span>सुझाए गए सवाल (Tap to Ask):</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              "आज और कल का मौसम कैसा रहेगा?",
              "क्या अगले 2 दिन में बारिश होगी?",
              "गेहूं में सिंचाई कब करनी चाहिए?",
              "मिर्च में माहू कीट की दवा बताओ"
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => submitVoiceQuery({ textQuery: q })}
                className="text-left bg-white/90 hover:bg-white p-2.5 rounded-2xl border border-green-200 text-xs font-medium text-green-900 shadow-sm transition-all flex items-center justify-between"
              >
                <span className="line-clamp-2">{q}</span>
                <ChevronRight className="w-3.5 h-3.5 text-green-600 flex-shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3-Day & Today Weather Forecast Widget */}
      <div className="bg-white rounded-3xl shadow-lg p-5 mb-4 border-2 border-amber-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-green-950 font-bold text-base flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span>मौसम पूर्वानुमान (Weather Forecast)</span>
            </h3>
            <p className="text-xs text-green-700 font-medium">
              {weatherData?.description || 'वास्तविक समय मौसम रिपोर्ट'}
            </p>
          </div>
          <Cloud className="w-7 h-7 text-blue-500 flex-shrink-0" />
        </div>

        {/* Today's Core Metrics */}
        {weatherData ? (
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="text-center bg-blue-50 rounded-2xl p-2.5 border border-blue-100">
              <Droplets className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-blue-900 text-[10px] font-semibold">बारिश (Rain)</p>
              <p className="text-blue-950 font-bold text-sm">{Math.round(weatherData.rain_probability || 0)}%</p>
            </div>
            
            <div className="text-center bg-orange-50 rounded-2xl p-2.5 border border-orange-100">
              <Thermometer className="w-5 h-5 text-orange-600 mx-auto mb-1" />
              <p className="text-orange-900 text-[10px] font-semibold">तापमान</p>
              <p className="text-orange-950 font-bold text-sm">{Math.round(weatherData.temperature || 0)}°C</p>
            </div>
            
            <div className="text-center bg-amber-50 rounded-2xl p-2.5 border border-amber-100">
              <Sun className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <p className="text-amber-900 text-[10px] font-semibold">आर्द्रता (नमी)</p>
              <p className="text-amber-950 font-bold text-sm">{Math.round(weatherData.humidity || 0)}%</p>
            </div>
          </div>
        ) : (
          <div className="text-center text-green-700 py-4 text-xs">
            मौसम डेटा लोड हो रहा है...
          </div>
        )}

        {/* 3-Day Forecast Cards (Today, Tomorrow, Day+2, Day+3) */}
        {multiDayForecast.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500 mb-2">
              अगले 3 दिनों का पूर्वानुमान (Next 3 Days):
            </p>
            <div className="grid grid-cols-4 gap-2">
              {multiDayForecast.slice(0, 4).map((day, idx) => (
                <div 
                  key={idx}
                  className={`p-2 rounded-2xl text-center border transition-all ${
                    idx === 0 
                      ? 'bg-green-50/80 border-green-300 shadow-sm' 
                      : 'bg-gray-50/80 border-gray-200'
                  }`}
                >
                  <p className="text-[10px] font-bold text-green-950 truncate">
                    {idx === 0 ? 'आज' : idx === 1 ? 'कल' : idx === 2 ? 'परसों' : '+3 दिन'}
                  </p>
                  
                  {/* Weather Icon based on rain */}
                  <div className="my-1 flex justify-center">
                    {day.rain_probability >= 60 ? (
                      <Droplets className="w-5 h-5 text-blue-600 animate-bounce" />
                    ) : day.rain_probability >= 30 ? (
                      <Cloud className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Sun className="w-5 h-5 text-amber-500" />
                    )}
                  </div>

                  <p className="text-[11px] font-black text-gray-900">
                    {Math.round(day.temp_max)}°
                  </p>
                  <p className="text-[9px] text-blue-700 font-bold">
                    💧 {Math.round(day.rain_probability)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Crop Health Summary */}
      <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-3xl shadow-lg p-5 text-white border-2 border-green-900">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base">आज की फसल रिपोर्ट</h3>
          <span className="text-2xl">🌾</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center bg-white/10 rounded-xl px-3 py-2 backdrop-blur">
            <span className="text-xs font-semibold">धान (Paddy) - स्वस्थ</span>
            <span className="text-lg">✅</span>
          </div>
          
          <div className="flex justify-between items-center bg-amber-500/20 rounded-xl px-3 py-2 backdrop-blur">
            <span className="text-xs font-semibold">गेहूं (Wheat) - सिंचाई आवश्यक</span>
            <span className="text-lg">💧</span>
          </div>
          
          <div className="flex justify-between items-center bg-white/10 rounded-xl px-3 py-2 backdrop-blur">
            <span className="text-xs font-semibold">मिट्टी की नमी - 72% अनुकूल</span>
            <span className="text-lg">🟢</span>
          </div>
        </div>
      </div>
    </div>
  );
}