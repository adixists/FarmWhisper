import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Volume2, Cloud, Bird, TreePine, Sun, Play, Pause, Square, Loader2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { generateAdvisory } from '../services/api';

export function StoryAdvisoryScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [storyText, setStoryText] = useState<string>(
    `"मिट्टी प्यास की गुहार लगाती है—\nपुरानी नदी के मोड़ से जल लाओ।\nबादल आते ही तांबे का घड़ा दबाओ,\nखेत में नमी की रखवाली करो।"`
  );
  const [tips, setTips] = useState<string[]>([
    'बारिश से पहले खेत में पानी संचय करें',
    'पुरानी सिंचाई प्रणाली को तैयार रखें',
    'मिट्टी की नमी के लिए जैविक गीली घास का उपयोग करें',
  ]);
  const [loadingStory, setLoadingStory] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setTtsSupported('speechSynthesis' in window);
    // Fetch a fresh story on mount
    fetchStory();
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const fetchStory = async () => {
    setLoadingStory(true);
    try {
      const result = await generateAdvisory('गेहूं', {
        issues: ['low moisture', 'yellow leaves'],
        recommendations: ['Increase watering', 'Apply nitrogen fertilizer'],
      });
      if (result.story) setStoryText(result.story);
      if (result.tips?.length) setTips(result.tips);
    } catch {
      // Keep defaults
    } finally {
      setLoadingStory(false);
    }
  };

  const startSpeaking = () => {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(storyText);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.85;
    utterance.pitch = 1.05;

    // Try to pick a Hindi voice
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(
      (v) => v.lang === 'hi-IN' || v.lang.startsWith('hi')
    );
    if (hindiVoice) utterance.voice = hindiVoice;

    utterance.onend = () => { setIsPlaying(false); setIsPaused(false); };
    utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseSpeaking = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const resumeSpeaking = () => {
    window.speechSynthesis.resume();
    setIsPaused(false);
    setIsPlaying(true);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handlePlayPause = () => {
    if (!ttsSupported) return;
    if (!isPlaying && !isPaused) {
      startSpeaking();
    } else if (isPlaying) {
      pauseSpeaking();
    } else if (isPaused) {
      resumeSpeaking();
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-amber-100 via-green-50 to-amber-50 p-6 relative overflow-hidden">
      {/* Background Illustration */}
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
        {loadingStory && (
          <div className="flex items-center justify-center gap-2 mt-2 text-green-600 text-xs">
            <Loader2 className="w-3 h-3 animate-spin" /> AI से नई कहानी लोड हो रही है...
          </div>
        )}
      </div>

      {/* Story Scene Image */}
      <div className="relative rounded-3xl overflow-hidden mb-6 shadow-2xl border-4 border-amber-300">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1706365694209-a885ec999615?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydXJhbCUyMGluZGlhJTIwdmlsbGFnZXxlbnwxfHx8fDE3NjQyNzEwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Village scene"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/80 to-transparent" />
        <div className="absolute inset-0 flex items-end justify-around p-4 text-white">
          <span className="text-4xl">👨‍🌾</span>
          <span className="text-4xl">🌾</span>
          <span className="text-4xl">🐄</span>
        </div>
      </div>

      {/* Poetic Story Box */}
      <div className="bg-white rounded-3xl shadow-xl p-6 mb-4 border-4 border-green-200 relative z-10">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">🌿</span>
          <div>
            <h3 className="text-green-900 mb-1">आज की कहानी</h3>
            <p className="text-green-800 text-sm italic">{new Date().toLocaleDateString('hi-IN')}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-green-50 rounded-2xl p-5 mb-4 border-l-4 border-amber-600">
          <p className="text-green-900 leading-relaxed italic whitespace-pre-line">
            {storyText}
          </p>
        </div>

        {/* Audio Player */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {/* Play / Pause */}
              <button
                onClick={handlePlayPause}
                disabled={!ttsSupported}
                className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-40"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-1" />
                )}
              </button>

              {/* Stop */}
              {(isPlaying || isPaused) && (
                <button
                  onClick={stopSpeaking}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <Square className="w-5 h-5 text-white" />
                </button>
              )}

              <div>
                <p className="text-white font-medium flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  कहानी सुनें – हिंदी में
                </p>
                <p className="text-green-100 text-xs">
                  {!ttsSupported
                    ? 'TTS इस browser में उपलब्ध नहीं (Chrome/Edge उपयोग करें)'
                    : isPlaying
                    ? '🔊 चल रहा है...'
                    : isPaused
                    ? '⏸ रुका हुआ है'
                    : '▶ चलाने के लिए दबाएं'}
                </p>
              </div>
            </div>
          </div>

          {/* Animated bar when playing */}
          {isPlaying && (
            <div className="flex gap-1 justify-center mt-2">
              {[0, 0.1, 0.2, 0.3, 0.4].map((d, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-amber-300 rounded-full"
                  animate={{ height: ['8px', '24px', '8px'] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: d }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Practical Tips */}
      {tips.length > 0 && (
        <div className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-200">
          <p className="text-blue-900 mb-2 font-medium">📚 व्यावहारिक सुझाव:</p>
          <ul className="space-y-1">
            {tips.map((tip, i) => (
              <li key={i} className="text-blue-800 text-sm flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span> {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Related Wisdom */}
      <div className="space-y-3 relative z-10">
        {[
          { emoji: '🌙', title: 'चांदनी रात में बीज बोना', desc: 'पूर्णिमा की रात बीज अंकुरण के लिए शुभ', bg: 'from-amber-600 to-amber-700' },
          { emoji: '🦜', title: 'पंछी के संकेत', desc: 'तोते का झुंड – बारिश 3 दिन में', bg: 'from-green-600 to-green-700' },
          { emoji: '💨', title: 'हवा की दिशा', desc: 'पूर्व से हवा – अच्छी फसल का संकेत', bg: 'from-blue-600 to-blue-700' },
        ].map((item, i) => (
          <div key={i} className={`bg-gradient-to-r ${item.bg} rounded-2xl p-4 text-white shadow-lg`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{item.emoji}</span>
              <div>
                <p className="mb-1">{item.title}</p>
                <p className="text-white/80 text-sm">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}