import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Volume2, Cloud, Bird, TreePine, Sun, Play, Pause, RotateCcw } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function StoryAdvisoryScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120); // 2 minutes mock duration
  const audioRef = useRef<HTMLAudioElement>(null);

  // Mock story text
  const storyText = `"मिट्टी प्यास की गुहार लगाती है—
पुरानी नदी के मोड़ से जल लाओ।
बादल आते ही तांबे का घड़ा दबाओ,
खेत में नमी की रखवाली करो।"`;

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      // In a real implementation, you would pause the audio
      console.log("Pausing story playback");
    } else {
      setIsPlaying(true);
      // In a real implementation, you would play the audio
      console.log("Playing story playback");
      
      // Simulate audio progress
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            clearInterval(interval);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const resetPlayback = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    // In a real implementation, you would reset the audio
    console.log("Resetting story playback");
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-amber-100 via-green-50 to-amber-50 p-6 relative overflow-hidden">
      {/* Background Illustration Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <motion.div
          className="absolute top-20 left-10"
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <Cloud className="w-16 h-16 text-blue-400" />
        </motion.div>
        
        <motion.div
          className="absolute top-40 right-10"
          animate={{ x: [0, 10, 0], y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        >
          <Bird className="w-12 h-12 text-amber-600" />
        </motion.div>
        
        <TreePine className="absolute bottom-20 left-5 w-20 h-20 text-green-600" />
        <Sun className="absolute top-10 right-20 w-12 h-12 text-yellow-500" />
      </div>

      {/* Header */}
      <div className="text-center mb-6 pt-4 relative z-10">
        <div className="text-4xl mb-2">📖</div>
        <h2 className="text-green-900 mb-2">कहानी में सलाह</h2>
        <p className="text-green-700 text-sm">दादी-नानी की बुद्धिमत्ता</p>
      </div>

      {/* Story Background Image */}
      <div className="relative rounded-3xl overflow-hidden mb-6 shadow-2xl border-4 border-amber-300">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1706365694209-a885ec999615?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydXJhbCUyMGluZGlhJTIwdmlsbGFnZXxlbnwxfHx8fDE3NjQyNzEwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Village scene"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/80 to-transparent" />
        
        {/* Folklore Illustrations Overlay */}
        <div className="absolute inset-0 flex items-end justify-around p-4 text-white">
          <span className="text-4xl">👨‍🌾</span>
          <span className="text-4xl">🌾</span>
          <span className="text-4xl">🐄</span>
        </div>
      </div>

      {/* Poetic Advisory Box */}
      <div className="bg-white rounded-3xl shadow-xl p-6 mb-4 border-4 border-green-200 relative z-10">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">🌿</span>
          <div>
            <h3 className="text-green-900 mb-2">आज की कहानी</h3>
            <p className="text-green-800 text-sm italic mb-1">27 नवंबर 2025</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-green-50 rounded-2xl p-5 mb-4 border-l-4 border-amber-600">
          <p className="text-green-900 leading-relaxed italic">
            {storyText}
          </p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-4 mb-4">
          <p className="text-blue-900 mb-2">📚 सीख:</p>
          <p className="text-blue-800 text-sm">
            बारिश से पहले खेत में पानी का संचय करें। पुरानी सिंचाई प्रणाली को तैयार रखें। 
            मिट्टी की नमी बनाए रखने के लिए जैविक गीली घास का उपयोग करें।
          </p>
        </div>

        {/* Audio Player Controls */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={togglePlayback}
                className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-1" />
                )}
              </button>
              <div>
                <p className="text-white font-medium">कहानी सुनें - हिंदी में</p>
                <p className="text-green-100 text-sm">{formatTime(currentTime)} / {formatTime(duration)}</p>
              </div>
            </div>
            <button 
              onClick={resetPlayback}
              className="text-white hover:text-amber-200 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-amber-300 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Related Wisdom Cards */}
      <div className="space-y-3 relative z-10">
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌙</span>
            <div>
              <p className="mb-1">चांदनी रात में बीज बोना</p>
              <p className="text-amber-100 text-sm">पूर्णिमा की रात बीज अंकुरण के लिए शुभ</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🦜</span>
            <div>
              <p className="mb-1">पंछी के संकेत</p>
              <p className="text-green-100 text-sm">तोते का झुंड - बारिश 3 दिन में</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💨</span>
            <div>
              <p className="mb-1">हवा की दिशा</p>
              <p className="text-blue-100 text-sm">पूर्व से हवा - अच्छी फसल का संकेत</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}