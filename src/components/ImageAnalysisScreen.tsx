import { useState, useRef, ChangeEvent } from 'react';
import { Camera, Upload, AlertTriangle, Droplets, Bug, Leaf } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { analyzeCropImage } from '../services/api';

export function ImageAnalysisScreen() {
  const [imageUploaded, setImageUploaded] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setImageUploaded(true);
    };
    reader.readAsDataURL(file);

    // Analyze the image
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await analyzeCropImage(file);
      setAnalysisResult(result);
    } catch (err) {
      setError('Failed to analyze image. Please try again.');
      console.error('Image analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-amber-50 to-green-50 p-6">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <div className="text-center mb-6 pt-4">
        <h2 className="text-green-900 mb-2">AI फोटो विश्लेषण</h2>
        <p className="text-green-700 text-sm">अपने खेत की तस्वीर अपलोड करें</p>
      </div>

      {/* Status messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Photo Upload Area */}
      <div className="relative mb-6">
        {!imageUploaded ? (
          <button
            onClick={triggerFileSelect}
            className="w-full h-64 bg-gradient-to-br from-green-100 to-amber-100 rounded-3xl border-4 border-dashed border-green-400 flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          >
            <Camera className="w-16 h-16 text-green-700 mb-3" />
            <p className="text-green-800 mb-2">फोटो खींचे या अपलोड करें</p>
            <div className="flex gap-2 mt-2">
              <Upload className="w-5 h-5 text-green-600" />
              <span className="text-green-700 text-sm">गैलरी से चुनें</span>
            </div>
          </button>
        ) : (
          <div className="relative rounded-3xl overflow-hidden shadow-lg border-4 border-green-300">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Field photo"
                className="w-full h-64 object-cover"
              />
            ) : (
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1627842822558-c1f15aef9838?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGVhdCUyMGZpZWxkJTIwZ29sZGVufGVufDF8fHx8MTc2NDIwOTI4N3ww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Field photo"
                className="w-full h-64 object-cover"
              />
            )}
            <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm">
              {isAnalyzing ? '✨ AI विश्लेषण हो रहा है...' : '✅ विश्लेषण पूर्ण'}
            </div>
          </div>
        )}
      </div>

      {isAnalyzing && (
        <div className="text-center text-green-700 mb-4">
          आपकी फसल का विश्लेषण किया जा रहा है...
        </div>
      )}

      {analysisResult && (
        <>
          {/* AI Detection Tags */}
          <div className="bg-white rounded-3xl shadow-lg p-5 mb-4 border-2 border-red-200">
            <h3 className="text-red-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              पहचाने गए मुद्दे
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {analysisResult.issues.map((issue: string, index: number) => (
                <span 
                  key={index}
                  className={`px-4 py-2 rounded-full text-sm border ${
                    issue.includes('moisture') || issue.includes('yellow') ?
                      'bg-blue-100 text-blue-800 border-blue-300' :
                    issue.includes('pest') ?
                      'bg-red-100 text-red-800 border-red-300' :
                      'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {issue.includes('moisture') ? '💧 नमी कम स्तर' :
                   issue.includes('yellow') ? '🍂 पत्ती पीली' :
                   issue.includes('pest') ? '🐛 कीट के शुरुआती संकेत' :
                   issue}
                </span>
              ))}
            </div>

            {/* Action Cards */}
            <div className="space-y-3">
              {analysisResult.recommendations.map((recommendation: string, index: number) => (
                <div 
                  key={index}
                  className={`rounded-2xl p-4 border-l-4 ${
                    recommendation.includes('water') || recommendation.includes('moisture') ?
                      'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-600' :
                    recommendation.includes('fertilizer') || recommendation.includes('nitrogen') ?
                      'bg-gradient-to-r from-green-50 to-green-100 border-green-600' :
                    recommendation.includes('pest') ?
                      'bg-gradient-to-r from-red-50 to-red-100 border-red-600' :
                      'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {recommendation.includes('water') || recommendation.includes('moisture') ? 
                      <Droplets className="w-6 h-6 text-blue-700 mt-1" /> :
                     recommendation.includes('fertilizer') || recommendation.includes('nitrogen') ?
                      <Leaf className="w-6 h-6 text-green-700 mt-1" /> :
                     recommendation.includes('pest') ?
                      <Bug className="w-6 h-6 text-red-700 mt-1" /> :
                      <Leaf className="w-6 h-6 text-amber-700 mt-1" />
                    }
                    <div>
                      <p className="text-green-900 mb-1">
                        {recommendation.includes('water') ? 'सिंचाई बढ़ाएं' :
                         recommendation.includes('fertilizer') || recommendation.includes('nitrogen') ? 'पोषक तत्व स्प्रे' :
                         recommendation.includes('pest') ? 'फेरोमोन ट्रैप लगाएं' :
                         'कार्रवाई करें'}
                      </p>
                      <p className="text-green-700 text-sm">{recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap Panel */}
          <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-3xl shadow-lg p-5 border-2 border-green-900">
            <h3 className="text-white mb-4">🛰️ सैटेलाइट हीटमैप</h3>
            
            <div className="relative h-48 bg-gradient-to-br from-green-900 to-amber-900 rounded-2xl overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1510138699702-2d26dde68e11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaWNlJTIwcGFkZHklMjBhZXJpYWx8ZW58MXx8fHwxNzY0MjcxMDc3fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Satellite view"
                className="w-full h-full object-cover opacity-70 mix-blend-overlay"
              />
              
              {/* Heatmap overlay indicators */}
              <div className="absolute inset-0 grid grid-cols-3 gap-2 p-3">
                {[
                  { color: 'bg-green-400', label: 'स्वस्थ' },
                  { color: 'bg-yellow-400', label: 'देखभाल' },
                  { color: 'bg-red-400', label: 'कमजोर' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center justify-center">
                    <div className={`w-12 h-12 ${item.color} rounded-full opacity-60 blur-sm`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-4 text-white text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-400 rounded-full" />
                <span>स्वस्थ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded-full" />
                <span>मध्यम</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-400 rounded-full" />
                <span>कमजोर</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}