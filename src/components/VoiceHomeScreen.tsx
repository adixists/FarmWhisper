import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Cloud, Droplets, Thermometer, Leaf, Sun, Wind, MessageSquare, Loader2 } from 'lucide-react';
import { healthCheck, getWeatherByLocation, processVoiceQuery } from '../services/api';

export function VoiceHomeScreen() {
  const [isListening, setIsListening] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [processingVoice, setProcessingVoice] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch weather on mount
  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        await healthCheck();
        const data = await getWeatherByLocation('New Delhi');
        setWeatherData(data);
      } catch (err) {
        setError('Backend से जुड़ने में समस्या। सुनिश्चित करें कि backend चल रहा है।');
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  const startRecording = async () => {
    setMicError(null);
    setTranscript(null);
    setAiResponse(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Stop all tracks
        streamRef.current?.getTracks().forEach((t) => t.stop());

        setProcessingVoice(true);
        try {
          const result = await processVoiceQuery(audioBlob);
          setTranscript(result.text || 'आवाज़ पहचान में समस्या।');
          if (result.ai_response) setAiResponse(result.ai_response);
        } catch (err) {
          setMicError('आवाज़ संसाधन में समस्या। दोबारा कोशिश करें।');
        } finally {
          setProcessingVoice(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setMicError('माइक्रोफोन की अनुमति नहीं मिली। Browser settings में allow करें।');
      } else {
        setMicError('माइक्रोफोन नहीं खुला। दोबारा कोशिश करें।');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-green-50 via-amber-50 to-green-100 p-6">
      {/* Header */}
      <div className="text-center mb-8 pt-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf className="w-8 h-8 text-green-700" />
          <span className="text-green-800 text-2xl">🌾</span>
        </div>
        <h1 className="text-green-900 mb-1">FarmWhisper</h1>
        <p className="text-green-700 text-sm">खेती का सच्चा साथी</p>
      </div>

      {/* Status */}
      {loading && (
        <div className="text-center mb-4 text-green-700 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Backend से जुड़ रहे हैं...
        </div>
      )}
      {error && (
        <div className="text-center mb-4 text-red-500 bg-red-50 p-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Mic Button */}
      <div className="flex flex-col items-center mb-6">
        <motion.button
          onClick={handleMicToggle}
          className={`relative w-40 h-40 rounded-full shadow-2xl flex items-center justify-center transition-colors ${
            isListening
              ? 'bg-gradient-to-br from-red-500 to-red-700'
              : 'bg-gradient-to-br from-green-600 to-green-800'
          }`}
          whileTap={{ scale: 0.95 }}
          animate={isListening ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
        >
          {isListening ? (
            <MicOff className="w-16 h-16 text-white" />
          ) : (
            <Mic className="w-16 h-16 text-white" />
          )}

          {/* Animated Waves */}
          {isListening && (
            <>
              <motion.div
                className="absolute w-40 h-40 rounded-full border-4 border-red-400 opacity-40"
                animate={{ scale: [1, 1.5, 1.5], opacity: [0.4, 0, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <motion.div
                className="absolute w-40 h-40 rounded-full border-4 border-amber-400 opacity-40"
                animate={{ scale: [1, 1.5, 1.5], opacity: [0.4, 0, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
              />
              <motion.div
                className="absolute w-40 h-40 rounded-full border-4 border-red-300 opacity-30"
                animate={{ scale: [1, 1.5, 1.5], opacity: [0.3, 0, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1 }}
              />
            </>
          )}
        </motion.button>

        <p className="mt-4 text-green-800 text-center">
          {isListening
            ? '🎤 सुन रहा हूँ... (बोलने के बाद फिर दबाएं)'
            : processingVoice
            ? '⏳ आवाज़ समझ रहा हूँ...'
            : 'FarmWhisper से पूछें'}
        </p>

        {processingVoice && (
          <div className="flex items-center gap-2 mt-2 text-green-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">आवाज़ की जांच हो रही है...</span>
          </div>
        )}

        {micError && (
          <div className="mt-3 text-red-600 bg-red-50 px-4 py-2 rounded-xl text-sm text-center">
            {micError}
          </div>
        )}
      </div>

      {/* Whispering Leaves */}
      <div className="flex justify-center gap-2 mb-6">
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

      {/* Transcript + AI Response */}
      {(transcript || aiResponse) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg p-5 mb-4 border-2 border-green-200"
        >
          {transcript && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-green-600" />
                <span className="text-green-800 text-sm font-medium">आपने कहा:</span>
              </div>
              <p className="text-green-900 bg-green-50 rounded-xl px-4 py-2 italic">"{transcript}"</p>
            </div>
          )}
          {aiResponse && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🌾</span>
                <span className="text-amber-800 text-sm font-medium">FarmWhisper का जवाब:</span>
              </div>
              <p className="text-green-800 bg-amber-50 rounded-xl px-4 py-3 leading-relaxed">{aiResponse}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Weather Card */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-4 border-2 border-amber-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-green-900">आज का मौसम</h3>
          <Cloud className="w-6 h-6 text-blue-500" />
        </div>

        {weatherData ? (
          <>
            <p className="text-green-700 text-xs mb-3 text-center">
              📍 {weatherData.location} — {weatherData.description}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center bg-orange-50 rounded-2xl p-3">
                <Thermometer className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                <p className="text-orange-900 text-xs mb-1">तापमान</p>
                <p className="text-orange-900 font-bold">{Math.round(weatherData.temperature || 0)}°C</p>
                <p className="text-orange-600 text-xs">Feels {Math.round(weatherData.feels_like || 0)}°C</p>
              </div>

              <div className="text-center bg-blue-50 rounded-2xl p-3">
                <Droplets className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-blue-900 text-xs mb-1">बारिश का अनुमान</p>
                <p className="text-blue-900 font-bold">{Math.round(weatherData.rain_probability || 0)}%</p>
              </div>

              <div className="text-center bg-yellow-50 rounded-2xl p-3">
                <Sun className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                <p className="text-yellow-900 text-xs mb-1">आर्द्रता</p>
                <p className="text-yellow-900 font-bold">{Math.round(weatherData.humidity || 0)}%</p>
              </div>

              <div className="text-center bg-green-50 rounded-2xl p-3">
                <Wind className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-green-900 text-xs mb-1">हवा की गति</p>
                <p className="text-green-900 font-bold">{weatherData.wind_speed || 0} km/h</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-green-700 py-4">मौसम डेटा लोड हो रहा है...</div>
        )}
      </div>

      {/* Crop Summary */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl shadow-lg p-6 text-white border-2 border-green-800">
        <div className="flex items-center justify-between mb-4">
          <h3>आज की फसल रिपोर्ट</h3>
          <span className="text-3xl">🌾</span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center bg-white/10 rounded-xl p-3 backdrop-blur">
            <span>धान - स्वस्थ</span>
            <span className="text-2xl">✅</span>
          </div>
          <div className="flex justify-between items-center bg-amber-500/20 rounded-xl p-3 backdrop-blur">
            <span>गेहूं - सिंचाई चाहिए</span>
            <span className="text-2xl">💧</span>
          </div>
          <div className="flex justify-between items-center bg-white/10 rounded-xl p-3 backdrop-blur">
            <span>मिट्टी की नमी - अच्छी</span>
            <span className="text-2xl">🟢</span>
          </div>
        </div>

        <p className="text-green-200 text-xs mt-3 text-center">
          📷 फसल की फोटो अपलोड करें → "फोटो" टैब
        </p>
      </div>
    </div>
  );
}