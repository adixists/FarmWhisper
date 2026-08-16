import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, Cloud, Droplets, Thermometer, Leaf, Sun, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { healthCheck, getWeatherData, getWeatherByLocation } from '../services/api';

export function VoiceHomeScreen() {
  const [isListening, setIsListening] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'granted' | 'denied' | 'locating'>('locating');

  // Function to request location and fetch live weather
  const requestLocationAndFetchWeather = () => {
    setLoading(true);
    setError(null);
    setLocationStatus('locating');

    if (!navigator.geolocation) {
      console.warn("Geolocation not supported by browser. Falling back to default.");
      setLocationStatus('denied');
      fetchFallbackWeather('New Delhi');
      return;
    }

    // Request GPS location from user
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationStatus('granted');
        try {
          await healthCheck();
          const data = await getWeatherData(latitude, longitude);
          setWeatherData(data);
        } catch (err) {
          console.error("Error fetching GPS weather data:", err);
          setError("स्थान आधारित मौसम प्राप्त करने में समस्या। डिफ़ॉल्ट डेटा दिखाया जा रहा है।");
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
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const fetchFallbackWeather = async (city: string) => {
    try {
      await healthCheck();
      const data = await getWeatherByLocation(city);
      setWeatherData(data);
    } catch (err) {
      setError('मौसम सेवा से जुड़ने में असमर्थ।');
      console.error('Error fetching fallback weather:', err);
    } finally {
      setLoading(false);
    }
  };

  // Automatically request location when app/component mounts
  useEffect(() => {
    requestLocationAndFetchWeather();
  }, []);

  return (
    <div className="min-h-full bg-gradient-to-br from-green-50 via-amber-50 to-green-100 p-6 pb-24">
      {/* Header */}
      <div className="text-center mb-6 pt-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Leaf className="w-8 h-8 text-green-700" />
          <span className="text-green-800 text-2xl">🌾</span>
        </div>
        <h1 className="text-green-900 font-bold text-2xl mb-0.5">FarmWhisper</h1>
        <p className="text-green-700 text-xs font-medium">खेती का सच्चा साथी • AI कृषि सहायक</p>
      </div>

      {/* Location Status Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-green-200 shadow-sm">
          <div className="flex items-center gap-2 overflow-hidden">
            <MapPin className={`w-4 h-4 flex-shrink-0 ${locationStatus === 'granted' ? 'text-green-600' : 'text-amber-600'}`} />
            <span className="text-xs font-semibold text-green-950 truncate">
              {weatherData?.location || (locationStatus === 'locating' ? 'स्थान खोजा जा रहा है...' : 'स्थान: New Delhi')}
            </span>
          </div>
          <button
            onClick={requestLocationAndFetchWeather}
            title="स्थान और मौसम रीफ्रेश करें"
            disabled={loading}
            className="flex items-center gap-1 text-[11px] font-bold text-green-700 hover:text-green-900 bg-green-100/60 hover:bg-green-100 px-2.5 py-1 rounded-xl transition-colors ml-2 flex-shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>अपडेट</span>
          </button>
        </div>
        
        {locationStatus === 'denied' && (
          <p className="text-[11px] text-amber-800 bg-amber-50/80 px-3 py-1.5 rounded-xl mt-1.5 border border-amber-200 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
            <span>सटीक मौसम के लिए ब्राउज़र में स्थान (Location) की अनुमति दें।</span>
          </p>
        )}
      </div>

      {/* Voice Assistant Button */}
      <div className="flex flex-col items-center mb-6">
        <motion.button
          onClick={() => setIsListening(!isListening)}
          className="relative w-36 h-36 rounded-full bg-gradient-to-br from-green-600 to-green-800 shadow-2xl flex items-center justify-center active:scale-95 transition-transform"
          whileTap={{ scale: 0.95 }}
          animate={isListening ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
        >
          <Mic className="w-14 h-14 text-white" />
          
          {/* Animated Waves */}
          {isListening && (
            <>
              <motion.div
                className="absolute w-36 h-36 rounded-full border-4 border-green-400 opacity-30"
                animate={{ scale: [1, 1.5, 1.5], opacity: [0.3, 0, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <motion.div
                className="absolute w-36 h-36 rounded-full border-4 border-amber-400 opacity-30"
                animate={{ scale: [1, 1.5, 1.5], opacity: [0.3, 0, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
              />
              <motion.div
                className="absolute w-36 h-36 rounded-full border-4 border-green-300 opacity-30"
                animate={{ scale: [1, 1.5, 1.5], opacity: [0.3, 0, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1 }}
              />
            </>
          )}
        </motion.button>
        
        <p className="mt-3 text-green-900 font-semibold text-sm">
          {isListening ? '🎤 सुन रहा हूँ... बोलिए' : 'पूछें FarmWhisper से (Speak)'}
        </p>
      </div>

      {/* Weather Card */}
      <div className="bg-white rounded-3xl shadow-lg p-5 mb-4 border-2 border-amber-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-green-950 font-bold text-base">आज का मौसम (Live Weather)</h3>
            <p className="text-xs text-green-700 font-medium">
              {weatherData?.description || 'वास्तविक समय मौसम रिपोर्ट'}
            </p>
          </div>
          <Cloud className="w-7 h-7 text-blue-500 flex-shrink-0" />
        </div>
        
        {weatherData ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-blue-50 rounded-2xl p-3 border border-blue-100">
              <Droplets className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
              <p className="text-blue-900 text-[11px] font-semibold mb-0.5">बारिश की संभावना</p>
              <p className="text-blue-950 font-bold text-base">{Math.round(weatherData.rain_probability || 0)}%</p>
            </div>
            
            <div className="text-center bg-orange-50 rounded-2xl p-3 border border-orange-100">
              <Thermometer className="w-5 h-5 text-orange-600 mx-auto mb-1.5" />
              <p className="text-orange-900 text-[11px] font-semibold mb-0.5">तापमान</p>
              <p className="text-orange-950 font-bold text-base">{Math.round(weatherData.temperature || 0)}°C</p>
            </div>
            
            <div className="text-center bg-amber-50 rounded-2xl p-3 border border-amber-100">
              <Sun className="w-5 h-5 text-amber-600 mx-auto mb-1.5" />
              <p className="text-amber-900 text-[11px] font-semibold mb-0.5">आर्द्रता (नमी)</p>
              <p className="text-amber-950 font-bold text-base">{Math.round(weatherData.humidity || 0)}%</p>
            </div>
          </div>
        ) : (
          <div className="text-center text-green-700 py-6 text-sm">
            मौसम डेटा लोड हो रहा है...
          </div>
        )}
      </div>

      {/* Crop Health Summary */}
      <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-3xl shadow-lg p-5 text-white border-2 border-green-900">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base">आज की फसल रिपोर्ट</h3>
          <span className="text-2xl">🌾</span>
        </div>
        
        <div className="space-y-2.5">
          <div className="flex justify-between items-center bg-white/10 rounded-xl px-3 py-2 backdrop-blur">
            <span className="text-sm font-medium">धान (Paddy) - स्वस्थ</span>
            <span className="text-xl">✅</span>
          </div>
          
          <div className="flex justify-between items-center bg-amber-500/20 rounded-xl px-3 py-2 backdrop-blur">
            <span className="text-sm font-medium">गेहूं (Wheat) - सिंचाई चाहिए</span>
            <span className="text-xl">💧</span>
          </div>
          
          <div className="flex justify-between items-center bg-white/10 rounded-xl px-3 py-2 backdrop-blur">
            <span className="text-sm font-medium">मिट्टी की नमी - अच्छी</span>
            <span className="text-xl">🟢</span>
          </div>
        </div>
      </div>
    </div>
  );
}