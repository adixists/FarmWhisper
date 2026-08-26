import { useState, useEffect } from 'react';
import { VoiceHomeScreen } from './components/VoiceHomeScreen';
import { ImageAnalysisScreen } from './components/ImageAnalysisScreen';
import { StoryAdvisoryScreen } from './components/StoryAdvisoryScreen';
import { CommunityScreen } from './components/CommunityScreen';
import { AnalyticsScreen } from './components/AnalyticsScreen';
import { Home, Camera, BookOpen, Users, BarChart3 } from 'lucide-react';
import { healthCheck } from './services/api';

type Screen = 'home' | 'image' | 'story' | 'community' | 'analytics';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check backend status when app loads
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await healthCheck();
        setBackendStatus('online');
      } catch (error) {
        console.error('Backend is offline:', error);
        setBackendStatus('offline');
      }
    };

    checkBackend();
  }, []);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <VoiceHomeScreen />;
      case 'image':
        return <ImageAnalysisScreen />;
      case 'story':
        return <StoryAdvisoryScreen />;
      case 'community':
        return <CommunityScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      default:
        return <VoiceHomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Backend Status Indicator */}
      {backendStatus === 'checking' && (
        <div className="bg-blue-500 text-white text-center py-2 text-sm">
          Checking backend connection...
        </div>
      )}
      
      {backendStatus === 'offline' && (
        <div className="bg-red-500 text-white text-center py-2 text-sm">
          Backend is offline. Some features may not work.
        </div>
      )}
      
      {/* Mobile App Container */}
      <div className="max-w-md mx-auto h-screen flex flex-col bg-white shadow-2xl overflow-hidden relative">
        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto">
          {renderScreen()}
        </div>

        {/* Bottom Navigation - Dark forest green as per design */}
        <nav style={{ background: '#1B4332' }} className="pb-safe relative z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
          <div className="flex justify-around items-center h-16 px-2">
            <button
              onClick={() => setActiveScreen('home')}
              className="flex flex-col items-center justify-center w-16 h-full transition-all duration-200"
            >
              <Home
                className="w-5 h-5 mb-1"
                style={{
                  color: activeScreen === 'home' ? '#ffffff' : 'rgba(255,255,255,0.55)',
                  fill: activeScreen === 'home' ? 'rgba(255,255,255,0.2)' : 'none',
                  strokeWidth: activeScreen === 'home' ? 2.5 : 1.5,
                  transform: activeScreen === 'home' ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s',
                }}
              />
              <span
                className="text-[10px] font-bold"
                style={{ color: activeScreen === 'home' ? '#ffffff' : 'rgba(255,255,255,0.55)' }}
              >होम</span>
            </button>

            <button
              onClick={() => setActiveScreen('image')}
              className="flex flex-col items-center justify-center w-16 h-full transition-all duration-200"
            >
              <Camera
                className="w-5 h-5 mb-1"
                style={{
                  color: activeScreen === 'image' ? '#ffffff' : 'rgba(255,255,255,0.55)',
                  fill: activeScreen === 'image' ? 'rgba(255,255,255,0.2)' : 'none',
                  strokeWidth: activeScreen === 'image' ? 2.5 : 1.5,
                  transform: activeScreen === 'image' ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s',
                }}
              />
              <span
                className="text-[10px] font-bold"
                style={{ color: activeScreen === 'image' ? '#ffffff' : 'rgba(255,255,255,0.55)' }}
              >फोटो</span>
            </button>

            <button
              onClick={() => setActiveScreen('story')}
              className="flex flex-col items-center justify-center w-16 h-full transition-all duration-200"
            >
              <BookOpen
                className="w-5 h-5 mb-1"
                style={{
                  color: activeScreen === 'story' ? '#ffffff' : 'rgba(255,255,255,0.55)',
                  fill: activeScreen === 'story' ? 'rgba(255,255,255,0.2)' : 'none',
                  strokeWidth: activeScreen === 'story' ? 2.5 : 1.5,
                  transform: activeScreen === 'story' ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s',
                }}
              />
              <span
                className="text-[10px] font-bold"
                style={{ color: activeScreen === 'story' ? '#ffffff' : 'rgba(255,255,255,0.55)' }}
              >सलाह</span>
            </button>

            <button
              onClick={() => setActiveScreen('community')}
              className="flex flex-col items-center justify-center w-16 h-full transition-all duration-200"
            >
              <Users
                className="w-5 h-5 mb-1"
                style={{
                  color: activeScreen === 'community' ? '#ffffff' : 'rgba(255,255,255,0.55)',
                  fill: activeScreen === 'community' ? 'rgba(255,255,255,0.2)' : 'none',
                  strokeWidth: activeScreen === 'community' ? 2.5 : 1.5,
                  transform: activeScreen === 'community' ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s',
                }}
              />
              <span
                className="text-[10px] font-bold"
                style={{ color: activeScreen === 'community' ? '#ffffff' : 'rgba(255,255,255,0.55)' }}
              >समुदाय</span>
            </button>

            <button
              onClick={() => setActiveScreen('analytics')}
              className="flex flex-col items-center justify-center w-16 h-full transition-all duration-200"
            >
              <BarChart3
                className="w-5 h-5 mb-1"
                style={{
                  color: activeScreen === 'analytics' ? '#ffffff' : 'rgba(255,255,255,0.55)',
                  fill: activeScreen === 'analytics' ? 'rgba(255,255,255,0.2)' : 'none',
                  strokeWidth: activeScreen === 'analytics' ? 2.5 : 1.5,
                  transform: activeScreen === 'analytics' ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s',
                }}
              />
              <span
                className="text-[10px] font-bold"
                style={{ color: activeScreen === 'analytics' ? '#ffffff' : 'rgba(255,255,255,0.55)' }}
              >आंकड़े</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}