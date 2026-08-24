import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Cloud, Droplets, Thermometer, Leaf, Sun, Volume2, VolumeX, Pause, Play, Sparkles, X } from 'lucide-react';
import { healthCheck, getWeatherData, getWeatherByLocation, processVoiceQuery } from '../services/api';

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
    <div className="min-h-full bg-gradient-to-br from-green-50 via-amber-50 to-green-100 p-6 pb-24">
      {/* Header */}
      <div className="text-center mb-8 pt-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf className="w-8 h-8 text-green-700" />
          <span className="text-green-800 text-2xl">🌾</span>
        </div>
        <h1 className="text-green-900 mb-1 font-bold text-2xl">FarmWhisper</h1>
        <p className="text-green-700 text-sm font-medium">खेती का सच्चा साथी</p>
      </div>

      {/* Status messages */}
      {loading && (
        <div className="text-center mb-4 text-green-700 text-sm">
          मौसम जानकारी लोड हो रही है...
        </div>
      )}
      
      {error && (
        <div className="text-center mb-4 text-red-500 bg-red-50 p-2 rounded-xl text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Voice Assistant Button */}
      <div className="flex flex-col items-center mb-8">
        <motion.button
          onClick={toggleListening}
          className={`relative w-40 h-40 rounded-full shadow-2xl flex items-center justify-center transition-all ${
            isListening 
              ? 'bg-gradient-to-br from-red-500 to-red-700' 
              : isProcessing
              ? 'bg-gradient-to-br from-amber-500 to-amber-700'
              : 'bg-gradient-to-br from-green-600 to-green-800'
          }`}
          whileTap={{ scale: 0.95 }}
          animate={isListening ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
        >
          <Mic className="w-16 h-16 text-white" />
          
          {/* Animated Waves */}
          {isListening && (
            <>
              <motion.div
                className="absolute w-40 h-40 rounded-full border-4 border-green-400 opacity-30 pointer-events-none"
                animate={{ scale: [1, 1.5, 1.5], opacity: [0.3, 0, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <motion.div
                className="absolute w-40 h-40 rounded-full border-4 border-amber-400 opacity-30 pointer-events-none"
                animate={{ scale: [1, 1.5, 1.5], opacity: [0.3, 0, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
              />
              <motion.div
                className="absolute w-40 h-40 rounded-full border-4 border-green-300 opacity-30 pointer-events-none"
                animate={{ scale: [1, 1.5, 1.5], opacity: [0.3, 0, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1 }}
              />
            </>
          )}
        </motion.button>
        
        <p className="mt-4 text-green-900 font-bold text-base">
          {isListening ? '🎤 सुन रहा हूँ... बोलिए' : isProcessing ? '✨ AI सोच रहा है...' : 'पूछें FarmWhisper से'}
        </p>

        {isListening && voiceQueryText && (
          <p className="text-xs text-green-800 mt-1.5 bg-green-100/80 px-3 py-1 rounded-full font-medium animate-pulse">
            "{voiceQueryText}"
          </p>
        )}
      </div>

      {/* Voice Response Card (Appears cleanly when answer is received) */}
      <AnimatePresence>
        {voiceResponse && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl p-5 mb-6 shadow-xl border-2 border-green-300 relative"
          >
            <button
              onClick={() => setVoiceResponse(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-green-950 text-sm">FarmWhisper उत्तर:</h3>
            </div>

            <p className="text-sm text-green-950 font-medium leading-relaxed mb-3">
              {voiceResponse.response_text}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                onClick={isSpeaking ? stopSpeaking : () => speakResponse(voiceResponse.response_text)}
                className="flex items-center gap-1.5 text-xs font-bold text-green-800 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-xl transition-colors"
              >
                {isSpeaking ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isSpeaking ? 'आवाज़ रोकें' : 'दोबारा सुनें'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Whispering Leaves Animation */}
      {!voiceResponse && (
        <div className="flex justify-center gap-2 mb-8">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div
              key={i}
              animate={{ rotate: [-10, 10, -10], y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2, delay }}
            >
              <Leaf className="w-6 h-6 text-green-600" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Weather Card */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-4 border-2 border-amber-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-green-900 font-bold text-lg">आज का मौसम</h3>
            <p className="text-xs text-green-700 font-medium">
              {weatherData?.location || 'स्थानीय मौसम'}
            </p>
          </div>
          <Cloud className="w-6 h-6 text-blue-500" />
        </div>
        
        {weatherData ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center bg-blue-50 rounded-2xl p-3 border border-blue-100">
              <Droplets className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-blue-900 text-xs mb-1 font-semibold">बारिश</p>
              <p className="text-blue-900 font-bold text-lg">{Math.round(weatherData.rain_probability || 0)}%</p>
            </div>
            
            <div className="text-center bg-orange-50 rounded-2xl p-3 border border-orange-100">
              <Thermometer className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="text-orange-900 text-xs mb-1 font-semibold">तापमान</p>
              <p className="text-orange-900 font-bold text-lg">{Math.round(weatherData.temperature || 0)}°C</p>
            </div>
            
            <div className="text-center bg-yellow-50 rounded-2xl p-3 border border-yellow-100">
              <Sun className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-yellow-900 text-xs mb-1 font-semibold">आर्द्रता</p>
              <p className="text-yellow-900 font-bold text-lg">{Math.round(weatherData.humidity || 0)}%</p>
            </div>
          </div>
        ) : (
          <div className="text-center text-green-700 py-4 text-sm font-medium">
            मौसम डेटा लोड हो रहा है...
          </div>
        )}
      </div>

      {/* Crop Health Summary */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl shadow-lg p-6 text-white border-2 border-green-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">आज की फसल रिपोर्ट</h3>
          <span className="text-3xl">🌾</span>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-white/10 rounded-xl p-3 backdrop-blur">
            <span className="font-medium">धान - स्वस्थ</span>
            <span className="text-2xl">✅</span>
          </div>
          
          <div className="flex justify-between items-center bg-amber-500/20 rounded-xl p-3 backdrop-blur">
            <span className="font-medium">गेहूं - सिंचाई चाहिए</span>
            <span className="text-2xl">💧</span>
          </div>
          
          <div className="flex justify-between items-center bg-white/10 rounded-xl p-3 backdrop-blur">
            <span className="font-medium">मिट्टी की नमी - अच्छी</span>
            <span className="text-2xl">🟢</span>
          </div>
        </div>
      </div>
    </div>
  );
}