import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Camera, Upload, AlertTriangle, Droplets, Bug, Leaf, X, Scan, FlaskConical } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { analyzeCropImage } from '../services/api';

export function ImageAnalysisScreen() {
  const [imageUploaded, setImageUploaded] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Camera specific states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const openCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      
      // We need a slight delay for the video element to be rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("कैमरा खोलने में अनुमति की समस्या। कृपया ब्राउज़र सेटिंग्स में कैमरा की अनुमति दें। (Camera access denied)");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // Convert base64 to Blob for API
        fetch(imageUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
            processImage(file, imageUrl);
          });
          
        stopCamera();
      }
    }
  };

  const handleGalleryUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      processImage(file, e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (file: File, previewUrl: string) => {
    setImagePreview(previewUrl);
    setImageUploaded(true);
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    
    try {
      const result = await analyzeCropImage(file);
      setAnalysisResult(result);
    } catch (err) {
      setError('फोटो विश्लेषण में समस्या। दोबारा कोशिश करें। (Failed to analyze image)');
      console.error('Image analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerGallery = () => {
    fileInputRef.current?.click();
  };

  const resetAnalysis = () => {
    setImageUploaded(false);
    setImagePreview(null);
    setAnalysisResult(null);
  };

  // Full screen camera view
  if (isCameraOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/70 to-transparent">
          <button 
            onClick={stopCamera}
            className="p-2 bg-white/20 rounded-full text-white backdrop-blur-sm"
          >
            <X className="w-6 h-6" />
          </button>
          <span className="text-white font-medium">खेत की फोटो खींचें</span>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {/* Live Video Feed */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="min-w-full min-h-full object-cover"
          />
          {/* Viewfinder overlay */}
          <div className="absolute inset-0 border-[40px] border-black/30 pointer-events-none"></div>
          <div className="absolute inset-20 border-2 border-white/50 rounded-xl pointer-events-none">
            <Scan className="w-16 h-16 text-white/50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent pb-12">
          <button 
            onClick={capturePhoto}
            className="w-20 h-20 bg-white rounded-full border-4 border-green-500 shadow-xl flex items-center justify-center active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 bg-white rounded-full border border-gray-200"></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-amber-50 to-green-50 p-6 pb-24">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleGalleryUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="text-center mb-6 pt-4">
        <h2 className="text-green-900 mb-2">AI फोटो विश्लेषण</h2>
        <p className="text-green-700 text-sm">अपने खेत की तस्वीर अपलोड करें (Upload your field picture)</p>
      </div>

      {/* Status messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}
      {cameraError && (
        <div className="bg-amber-100 border border-amber-400 text-amber-800 px-4 py-3 rounded-xl mb-4 text-sm">
          {cameraError}
        </div>
      )}

      {/* Photo Selection / Display Area */}
      <div className="relative mb-6">
        {!imageUploaded ? (
          <div className="w-full bg-gradient-to-br from-white to-green-50 rounded-3xl border-2 border-green-200 p-6 shadow-xl">
            <div className="grid grid-cols-2 gap-4">
              {/* Camera Option */}
              <button
                onClick={openCamera}
                className="flex flex-col items-center justify-center p-6 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-md transition-colors"
              >
                <Camera className="w-12 h-12 mb-3" />
                <span className="font-semibold text-lg">कैमरा</span>
                <span className="text-xs text-green-100 opacity-90 mt-1">Take Photo</span>
              </button>

              {/* Gallery Option */}
              <button
                onClick={triggerGallery}
                className="flex flex-col items-center justify-center p-6 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-md transition-colors"
              >
                <Upload className="w-12 h-12 mb-3 text-white" />
                <span className="font-semibold text-lg text-white">गैलरी</span>
                <span className="text-xs text-white opacity-90 mt-1">Upload File</span>
              </button>
            </div>
            <p className="text-center text-green-800 text-sm mt-6 font-medium">
              सर्वोत्तम परिणामों के लिए, सुनिश्चित करें कि पत्तियां या प्रभावित हिस्सा स्पष्ट रूप से दिखाई दे रहा है।
            </p>
          </div>
        ) : (
          <div className="relative rounded-3xl overflow-hidden shadow-lg border-4 border-green-300">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Field photo"
                className="w-full h-64 object-cover"
              />
            )}
            <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md">
              {isAnalyzing ? '✨ AI विश्लेषण हो रहा है...' : '✅ विश्लेषण पूर्ण'}
            </div>
            {!isAnalyzing && (
              <button 
                onClick={resetAnalysis}
                className="absolute bottom-3 right-3 bg-white/90 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur shadow-md hover:bg-white transition-colors"
              >
                नई फोटो लें (New Photo)
              </button>
            )}
          </div>
        )}
      </div>

      {isAnalyzing && (
        <div className="text-center text-green-700 mb-8 p-6 bg-white rounded-2xl shadow-sm border border-green-100">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="font-medium text-lg">FarmWhisper AI विश्लेषण कर रहा है...</p>
          <p className="text-sm opacity-80 mt-1">Analyzing crop details, please wait.</p>
        </div>
      )}

      {/* Detailed Analysis Results */}
      {analysisResult && (
        <div className="space-y-4">
          {/* Crop Identity & Health Overview */}
          <div className="bg-white rounded-3xl shadow-lg p-5 border-2 border-green-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-green-900 text-2xl font-bold mb-1">
                  🌱 {analysisResult.crop_identified}
                </h3>
              </div>
              
              <div className={`rounded-2xl px-5 py-3 text-center text-white shadow-md ${
                analysisResult.confidence_score >= 0.8 ? 'bg-gradient-to-br from-green-500 to-green-600' :
                analysisResult.confidence_score >= 0.5 ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                'bg-gradient-to-br from-red-500 to-red-600'
              }`}>
                <p className="text-3xl font-black">{Math.round(analysisResult.confidence_score * 100)}%</p>
                <p className="text-[10px] uppercase tracking-wider font-bold opacity-90">Confidence</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 ${
                analysisResult.issue_detected?.toLowerCase().includes('healthy') || analysisResult.issue_detected?.toLowerCase().includes('स्वस्थ') 
                  ? 'bg-green-100 text-green-800 border-green-300' 
                  : 'bg-red-100 text-red-800 border-red-300'
              }`}>
                {analysisResult.issue_detected?.toLowerCase().includes('healthy') || analysisResult.issue_detected?.toLowerCase().includes('स्वस्थ') 
                  ? '✅ ' + analysisResult.issue_detected
                  : '⚠️ Issue: ' + analysisResult.issue_detected}
              </span>
            </div>
          </div>

          {/* Diagnosis & Fault Description */}
          {analysisResult.treatment_plan?.fault_description && (
            <div className="bg-red-50 rounded-3xl shadow-lg p-5 border-2 border-red-200">
              <h3 className="text-red-900 mb-3 flex items-center gap-2 font-bold text-lg">
                <AlertTriangle className="w-6 h-6" /> Diagnosis (निदान)
              </h3>
              <p className="text-red-800 text-sm whitespace-pre-line leading-relaxed">
                {analysisResult.treatment_plan.fault_description}
              </p>
            </div>
          )}

          {/* Structured Treatment Plan */}
          <div className="bg-white rounded-3xl shadow-lg p-5 border-2 border-blue-200">
            <h3 className="text-blue-900 mb-4 flex items-center gap-2 font-bold text-lg">
              <FlaskConical className="w-6 h-6" /> Treatment Plan (उपचार योजना)
            </h3>
            
            <div className="space-y-4">
              {/* Immediate Remedy */}
              {analysisResult.treatment_plan?.immediate_remedy && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-orange-500 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Droplets className="w-6 h-6 text-orange-700 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-orange-900 font-bold mb-1">Immediate Action (तत्काल उपाय)</p>
                      <p className="text-orange-800 text-sm whitespace-pre-line leading-relaxed">
                        {analysisResult.treatment_plan.immediate_remedy}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pesticides and Fertilizers */}
              {analysisResult.treatment_plan?.pesticides_fertilizers_required?.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Bug className="w-6 h-6 text-blue-700 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-blue-900 font-bold mb-1">Chemicals & Fertilizers (दवा/उर्वरक)</p>
                      <ul className="space-y-2 mt-2">
                        {analysisResult.treatment_plan.pesticides_fertilizers_required.map((chem: string, i: number) => (
                          <li key={i} className="text-sm text-blue-800 flex items-start gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                            <span className="text-blue-500 mt-0.5">•</span> {chem}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Preventative Care */}
              {analysisResult.treatment_plan?.preventative_care && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Leaf className="w-6 h-6 text-green-700 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-green-900 font-bold mb-1">Preventative Care (बचाव के तरीके)</p>
                      <p className="text-green-800 text-sm whitespace-pre-line leading-relaxed">
                        {analysisResult.treatment_plan.preventative_care}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}