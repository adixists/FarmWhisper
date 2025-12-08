import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, Cloud, Droplets, Thermometer, Leaf, Sun } from 'lucide-react';
import { healthCheck, getWeatherByLocation } from '../services/api';

export function VoiceHomeScreen() {
  const [isListening, setIsListening] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch weather data when component mounts
  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true);
      try {
        // Check if backend is running
        await healthCheck();
        
        // Fetch weather data for a default location (you can change this)
        const data = await getWeatherByLocation('New Delhi');
        setWeatherData(data);
      } catch (err) {
        setError('Failed to fetch weather data. Make sure the backend is running.');
        console.error('Error fetching weather data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

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

      {/* Status indicator */}
      {loading && (
        <div className="text-center mb-4 text-green-700">
          Connecting to backend...
        </div>
      )}
      
      {error && (
        <div className="text-center mb-4 text-red-500 bg-red-50 p-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Voice Assistant Button */}
      <div className="flex flex-col items-center mb-8">
        <motion.button
          onClick={() => setIsListening(!isListening)}
          className="relative w-40 h-40 rounded-full bg-gradient-to-br from-green-600 to-green-800 shadow-2xl flex items-center justify-center"
          whileTap={{ scale: 0.95 }}
          animate={isListening ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
        >
          <Mic className="w-16 h-16 text-white" />
          
          {/* Animated Waves */}
          {isListening && (
            <>
              <motion.div
                className="absolute w-40 h-40 rounded-full border-4 border-green-400 opacity-30"
                animate={{ scale: [1, 1.5, 1.5], opacity: [0.3, 0, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <motion.div
                className="absolute w-40 h-40 rounded-full border-4 border-amber-400 opacity-30"
                animate={{ scale: [1, 1.5, 1.5], opacity: [0.3, 0, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
              />
              <motion.div
                className="absolute w-40 h-40 rounded-full border-4 border-green-300 opacity-30"
                animate={{ scale: [1, 1.5, 1.5], opacity: [0.3, 0, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1 }}
              />
            </>
          )}
        </motion.button>
        
        <p className="mt-4 text-green-800">
          {isListening ? '🎤 सुन रहा हूँ...' : 'पूछें FarmWhisper से'}
        </p>
      </div>

      {/* Whispering Leaves Animation */}
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

      {/* Weather Card */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-4 border-2 border-amber-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-green-900">आज का मौसम</h3>
          <Cloud className="w-6 h-6 text-blue-500" />
        </div>
        
        {weatherData ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center bg-blue-50 rounded-2xl p-3">
              <Droplets className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-blue-900 text-xs mb-1">बारिश</p>
              <p className="text-blue-900">{Math.round(weatherData.rain_probability || 0)}%</p>
            </div>
            
            <div className="text-center bg-orange-50 rounded-2xl p-3">
              <Thermometer className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="text-orange-900 text-xs mb-1">तापमान</p>
              <p className="text-orange-900">{Math.round(weatherData.temperature || 0)}°C</p>
            </div>
            
            <div className="text-center bg-yellow-50 rounded-2xl p-3">
              <Sun className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-yellow-900 text-xs mb-1">आर्द्रता</p>
              <p className="text-yellow-900">{Math.round(weatherData.humidity || 0)}%</p>
            </div>
          </div>
        ) : (
          <div className="text-center text-green-700 py-4">
            Loading weather data...
          </div>
        )}
      </div>

      {/* Crop Health Summary */}
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
      </div>
    </div>
  );
}