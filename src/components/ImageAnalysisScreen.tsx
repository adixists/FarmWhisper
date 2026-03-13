import { useState, useRef, ChangeEvent } from 'react';
import { Camera, Upload, AlertTriangle, Droplets, Bug, Leaf, Pill, CheckCircle2, Loader2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { analyzeCropImage, generateAdvisory } from '../services/api';

export function ImageAnalysisScreen() {
  const [imageUploaded, setImageUploaded] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [advisory, setAdvisory] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setImageUploaded(true);
    };
    reader.readAsDataURL(file);

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setAdvisory(null);

    try {
      const result = await analyzeCropImage(file);
      setAnalysisResult(result);

      // Also fetch AI story advisory based on analysis
      try {
        const adv = await generateAdvisory(result.crop_name || 'crop', result);
        setAdvisory(adv);
      } catch {
        // advisory is optional
      }
    } catch (err) {
      setError('फोटो विश्लेषण में समस्या। दोबारा कोशिश करें।');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const healthColor = (score: number) =>
    score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-600';

  const healthBg = (score: number) =>
    score >= 70 ? 'from-green-500 to-green-600' : score >= 40 ? 'from-amber-500 to-amber-600' : 'from-red-500 to-red-600';

  return (
    <div className="min-h-full bg-gradient-to-br from-amber-50 to-green-50 p-6 pb-24">
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Upload Area */}
      <div className="relative mb-6">
        {!imageUploaded ? (
          <button
            onClick={() => fileInputRef.current?.click()}
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
              <img src={imagePreview} alt="Field photo" className="w-full h-64 object-cover" />
            ) : (
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1627842822558-c1f15aef9838?w=800"
                alt="Field photo"
                className="w-full h-64 object-cover"
              />
            )}
            <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              {isAnalyzing ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> AI विश्लेषण हो रहा है...</>
              ) : (
                <><CheckCircle2 className="w-3 h-3" /> विश्लेषण पूर्ण</>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-3 right-3 bg-white/80 text-green-800 px-3 py-1 rounded-full text-xs font-medium backdrop-blur"
            >
              नई फोटो
            </button>
          </div>
        )}
      </div>

      {isAnalyzing && (
        <div className="text-center text-green-700 mb-4 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Gemini AI फसल की जाँच कर रहा है...
        </div>
      )}

      {analysisResult && (
        <>
          {/* Crop ID Card */}
          <div className="bg-white rounded-3xl shadow-lg p-5 mb-4 border-2 border-green-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-green-900">
                  🌱 {analysisResult.crop_name || 'अज्ञात फसल'}
                </h3>
                {analysisResult.crop_name_hindi && (
                  <p className="text-green-700 text-sm">{analysisResult.crop_name_hindi}</p>
                )}
              </div>
              {/* Health Score */}
              <div className={`bg-gradient-to-br ${healthBg(analysisResult.health_score || 0)} rounded-2xl px-4 py-3 text-center text-white shadow`}>
                <p className="text-3xl font-bold">{analysisResult.health_score || 0}</p>
                <p className="text-xs opacity-90">स्वास्थ्य स्कोर</p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                analysisResult.health_status === 'Healthy'
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : analysisResult.health_status === 'Diseased'
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {analysisResult.health_status === 'Healthy' ? '✅ स्वस्थ' :
                 analysisResult.health_status === 'Diseased' ? '🤒 रोगग्रस्त' :
                 analysisResult.health_status === 'Stressed' ? '⚠️ तनावग्रस्त' :
                 analysisResult.health_status || '⚠️ जाँच करें'}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm border ${
                analysisResult.needs_water
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              }`}>
                {analysisResult.needs_water ? '💧 पानी चाहिए' : '✓ पानी ठीक है'}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm border ${
                analysisResult.pest_risk === 'high'
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : analysisResult.pest_risk === 'medium'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-green-100 text-green-800 border-green-300'
              }`}>
                🐛 कीट जोखिम: {analysisResult.pest_risk === 'high' ? 'अधिक' :
                               analysisResult.pest_risk === 'medium' ? 'मध्यम' : 'कम'}
              </span>
            </div>
          </div>

          {/* Issues */}
          {analysisResult.issues?.length > 0 && (
            <div className="bg-white rounded-3xl shadow-lg p-5 mb-4 border-2 border-red-200">
              <h3 className="text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> पहचाने गए मुद्दे
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {analysisResult.issues.map((issue: string, i: number) => (
                  <span key={i} className="px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800 border border-amber-300">
                    {issue.includes('moisture') ? '💧 नमी कम' :
                     issue.includes('yellow') ? '🍂 पत्ती पीली' :
                     issue.includes('pest') ? '🐛 कीट संकेत' : issue}
                  </span>
                ))}
              </div>
              {analysisResult.diseases?.length > 0 && (
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-red-800 text-sm font-medium mb-1">🦠 रोग:</p>
                  {analysisResult.diseases.map((d: string, i: number) => (
                    <p key={i} className="text-red-700 text-sm">• {d}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fertilizer & Remedy */}
          <div className="bg-white rounded-3xl shadow-lg p-5 mb-4 border-2 border-amber-200">
            <h3 className="text-amber-900 mb-3 flex items-center gap-2">
              <Pill className="w-5 h-5" /> उपचार एवं खाद
            </h3>
            {analysisResult.fertilizer_recommendation && analysisResult.fertilizer_recommendation !== 'Not required' && (
              <div className="bg-green-50 border-l-4 border-green-600 rounded-xl p-4 mb-3">
                <div className="flex items-start gap-3">
                  <Leaf className="w-5 h-5 text-green-700 mt-0.5" />
                  <div>
                    <p className="text-green-900 font-medium text-sm">खाद:</p>
                    <p className="text-green-800 text-sm">{analysisResult.fertilizer_recommendation}</p>
                  </div>
                </div>
              </div>
            )}
            {analysisResult.remedy && (
              <div className="bg-blue-50 border-l-4 border-blue-600 rounded-xl p-4 mb-3">
                <div className="flex items-start gap-3">
                  <Droplets className="w-5 h-5 text-blue-700 mt-0.5" />
                  <div>
                    <p className="text-blue-900 font-medium text-sm">उपाय:</p>
                    <p className="text-blue-800 text-sm">{analysisResult.remedy}</p>
                  </div>
                </div>
              </div>
            )}
            {analysisResult.recommendations?.map((rec: string, i: number) => (
              <div key={i} className={`rounded-xl p-3 mb-2 border-l-4 flex items-start gap-2 ${
                rec.toLowerCase().includes('water') || rec.toLowerCase().includes('irrig')
                  ? 'bg-blue-50 border-blue-500'
                  : rec.toLowerCase().includes('fertilizer') || rec.toLowerCase().includes('nitrogen')
                  ? 'bg-green-50 border-green-500'
                  : rec.toLowerCase().includes('pest') || rec.toLowerCase().includes('spray')
                  ? 'bg-red-50 border-red-500'
                  : 'bg-amber-50 border-amber-500'
              }`}>
                {rec.toLowerCase().includes('water') ? <Droplets className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" /> :
                 rec.toLowerCase().includes('pest') ? <Bug className="w-4 h-4 text-red-700 mt-0.5 shrink-0" /> :
                 <Leaf className="w-4 h-4 text-green-700 mt-0.5 shrink-0" />}
                <p className="text-sm text-gray-800">{rec}</p>
              </div>
            ))}
          </div>

          {/* AI Story Advisory */}
          {advisory?.story && (
            <div className="bg-gradient-to-br from-amber-50 to-green-50 rounded-3xl shadow-lg p-5 mb-4 border-2 border-amber-300">
              <h3 className="text-amber-900 mb-3">🌿 FarmWhisper की सलाह</h3>
              <p className="text-green-800 italic leading-relaxed mb-3">{advisory.story}</p>
              {advisory.tips?.map((tip: string, i: number) => (
                <p key={i} className="text-green-700 text-sm mb-1">• {tip}</p>
              ))}
            </div>
          )}

          {/* Heatmap Panel */}
          <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-3xl shadow-lg p-5 border-2 border-green-900">
            <h3 className="text-white mb-4">🛰️ सैटेलाइट हीटमैप</h3>
            <div className="relative h-48 bg-gradient-to-br from-green-900 to-amber-900 rounded-2xl overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1510138699702-2d26dde68e11?w=800"
                alt="Satellite view"
                className="w-full h-full object-cover opacity-70 mix-blend-overlay"
              />
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
              {[
                { color: 'bg-green-400', label: 'स्वस्थ' },
                { color: 'bg-yellow-400', label: 'मध्यम' },
                { color: 'bg-red-400', label: 'कमजोर' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-4 h-4 ${item.color} rounded-full`} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}