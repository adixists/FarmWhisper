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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-green-50">
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
      <div className="max-w-md mx-auto h-screen flex flex-col bg-white shadow-2xl">
        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto">
          {renderScreen()}
        </div>

        {/* Bottom Navigation */}
        <nav className="bg-gradient-to-r from-green-700 to-green-800 border-t border-green-900 pb-safe">
          <div className="flex justify-around items-center h-16">
            <button
              onClick={() => setActiveScreen('home')}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                activeScreen === 'home' ? 'text-amber-300' : 'text-green-100'
              }`}
            >
              <Home className="w-6 h-6 mb-1" />
              <span className="text-xs">होम</span>
            </button>
            
            <button
              onClick={() => setActiveScreen('image')}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                activeScreen === 'image' ? 'text-amber-300' : 'text-green-100'
              }`}
            >
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs">फोटो</span>
            </button>
            
            <button
              onClick={() => setActiveScreen('story')}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                activeScreen === 'story' ? 'text-amber-300' : 'text-green-100'
              }`}
            >
              <BookOpen className="w-6 h-6 mb-1" />
              <span className="text-xs">सलाह</span>
            </button>
            
            <button
              onClick={() => setActiveScreen('community')}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                activeScreen === 'community' ? 'text-amber-300' : 'text-green-100'
              }`}
            >
              <Users className="w-6 h-6 mb-1" />
              <span className="text-xs">समुदाय</span>
            </button>
            
            <button
              onClick={() => setActiveScreen('analytics')}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                activeScreen === 'analytics' ? 'text-amber-300' : 'text-green-100'
              }`}
            >
              <BarChart3 className="w-6 h-6 mb-1" />
              <span className="text-xs">आंकड़े</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}