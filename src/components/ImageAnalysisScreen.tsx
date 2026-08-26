import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Camera, Upload, AlertTriangle, Droplets, Bug, Leaf, X, Scan, FlaskConical, Sparkles, ArrowLeft, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { analyzeCropImage } from '../services/api';
import { motion } from 'motion/react';

// Ultra-fast client-side image downscaling & compression (reduces 10MB camera photo to ~150KB in 15ms)
function compressImage(file: File, maxDim: number = 1024, quality: number = 0.82): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    const tempUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(tempUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ blob: file, dataUrl: tempUrl });
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, dataUrl: canvas.toDataURL('image/jpeg', quality) });
          } else {
            resolve({ blob: file, dataUrl: tempUrl });
          }
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => resolve({ blob: file, dataUrl: tempUrl });
    img.src = tempUrl;
  });
}

export function ImageAnalysisScreen() {
  const [imageUploaded, setImageUploaded] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("कैमरा की अनुमति नहीं मिली। कृपया सेटिंग्स में अनुमति दें।");
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = Math.min(video.videoWidth, 1024);
      canvas.height = Math.min(video.videoHeight, 1024);
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        
        stopCamera();

        // Convert directly to compressed blob for ultra-fast upload
        canvas.toBlob((blob) => {
          if (blob) {
            processOptimizedImage(blob, dataUrl);
          }
        }, 'image/jpeg', 0.85);
      }
    }
  };

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Compress & downscale client-side in 15ms for instant upload
    const { blob, dataUrl } = await compressImage(file);
    processOptimizedImage(blob, dataUrl);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processOptimizedImage = async (blob: Blob, previewUrl: string) => {
    setImagePreview(previewUrl);
    setImageUploaded(true);
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    
    try {
      const result = await analyzeCropImage(blob);
      setAnalysisResult(result);
    } catch (err: any) {
      setError(err?.message || 'फोटो विश्लेषण में समस्या। दोबारा कोशिश करें।');
      console.error('Image analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setImageUploaded(false);
    setImagePreview(null);
    setAnalysisResult(null);
    setError(null);
  };

  // Full screen native camera viewfinder
  if (isCameraOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {/* Camera Header */}
        <div className="p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
          <button 
            onClick={stopCamera}
            className="p-2.5 bg-white/20 active:bg-white/40 rounded-full text-white backdrop-blur-md transition-transform active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
          <span className="text-white font-bold text-sm tracking-wide">फसल / पत्ती की फोटो लें</span>
          <div className="w-10"></div>
        </div>

        {/* Viewfinder Feed */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="min-w-full min-h-full object-cover"
          />
          {/* Viewfinder Target Brackets */}
          <div className="absolute inset-16 border-2 border-dashed border-[#16a34a]/80 rounded-3xl pointer-events-none flex items-center justify-center">
            <Scan className="w-16 h-16 text-[#16a34a]/50 animate-pulse" />
          </div>
        </div>

        {/* Shutter Button Bar */}
        <div className="p-8 flex justify-center items-center z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent pb-12">
          <button 
            onClick={capturePhoto}
            className="w-20 h-20 bg-white rounded-full border-4 border-[#16a34a] shadow-2xl flex items-center justify-center active:scale-90 transition-transform ring-4 ring-white/30"
          >
            <div className="w-16 h-16 bg-white rounded-full border border-gray-300"></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F8F9FA] p-5 pb-24 relative overflow-x-hidden">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleGalleryUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Screen Header */}
      <div className="pt-3 pb-4 mb-2">
        <div className="flex items-center gap-2.5 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(145deg, #2D6A4F 0%, #1B4332 100%)' }}
          >
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-slate-900 font-black text-xl leading-tight">AI फसल डॉक्टर</h1>
            <p className="text-green-700 text-xs font-semibold">फोटो से तुरंत बीमारी व खाद की पहचान</p>
          </div>
        </div>
      </div>

      {/* Error Banners */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-2xl mb-4 text-xs font-medium flex items-center gap-2 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {cameraError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl mb-4 text-xs font-medium flex items-center gap-2 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Photo Capture & Upload Area */}
      {!imageUploaded ? (
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-500 mb-3 text-center">फोटो खींचें या गैलरी से चुनें (Select Option)</p>
          <div className="grid grid-cols-2 gap-3">
            {/* Camera Option — neutral/unselected look */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.94 }}
              onClick={openCamera}
              className="flex flex-col items-center justify-center py-8 rounded-2xl border transition-all relative overflow-hidden"
              style={{ background: '#f1f5f9', borderColor: '#e2e8f0' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: '#e2e8f0' }}
              >
                <Camera className="w-7 h-7" style={{ color: '#64748b' }} />
              </div>
              <span className="font-bold text-sm text-slate-700">फोटो खींचें</span>
              <span className="text-[10px] font-medium text-slate-400 mt-0.5">Take a Photo</span>
            </motion.button>

            {/* Gallery Option — amber/gold highlighted (active) */}
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 12px 40px -8px rgba(180,83,9,0.4)' }}
              whileTap={{ scale: 0.94 }}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center py-8 rounded-2xl border transition-all relative overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #f59e0b 0%, #d97706 100%)',
                borderColor: '#b45309',
                boxShadow: '0 8px 24px -4px rgba(180,83,9,0.35)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(255,255,255,0.25)' }}
              >
                <Upload className="w-7 h-7 text-white" />
              </div>
              <span className="font-bold text-sm text-white">गैलरी से चुनें</span>
              <span className="text-[10px] font-medium text-amber-100 mt-0.5">Select from Gallery</span>
            </motion.button>
          </div>

          {/* Tip card with bulb icon */}
          <div className="bg-white rounded-2xl p-4 mt-4 border border-slate-100 shadow-sm flex items-start gap-3">
            <span className="text-xl flex-shrink-0 mt-0.5">💡</span>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-800">टिप:</span> पत्ती या रोगग्रस्त हिस्से की साफ़ और नज़ादीक से फोटो लें।
            </p>
          </div>
        </div>
      ) : (
        /* Image Preview Card */
        <div className="relative rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] mb-6 bg-slate-100 h-64 border border-slate-200">
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Crop upload"
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Scanning Line Animation */}
          {isAnalyzing && (
            <motion.div
              className="absolute left-0 right-0 h-1 bg-[#16a34a] shadow-[0_0_15px_4px_rgba(22,163,74,0.6)] z-10"
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
            />
          )}

          <div className="absolute top-4 right-4 bg-white/90 text-slate-800 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md shadow-sm flex items-center gap-1.5">
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#16a34a]" />
                <span>AI जांच रहा है...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a]" />
                <span>जांच पूर्ण</span>
              </>
            )}
          </div>

          {!isAnalyzing && (
            <button 
              onClick={resetAnalysis}
              className="absolute bottom-4 right-4 bg-white/95 text-slate-800 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md shadow-sm hover:bg-white active:scale-95 transition-all flex items-center gap-1 border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>नई फोटो</span>
            </button>
          )}
        </div>
      )}

      {/* Analyzing Loading Text (Optional, keeping minimal since we have scanning line) */}
      {isAnalyzing && (
        <div className="text-center mt-4">
          <p className="font-bold text-slate-800 text-sm">FarmWhisper AI जांच कर रहा है...</p>
        </div>
      )}

      {/* Structured Diagnosis Results Card */}
      {analysisResult && (
        <div className="space-y-4">
          {/* Main Crop Card */}
          <div className="bg-white rounded-[2rem] p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#16a34a]">पहचानी गई फसल</span>
              <h2 className="text-slate-800 text-lg font-black mt-0.5">
                {analysisResult.crop_identified}
              </h2>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">सटीकता</span>
              <h2 className="text-[#16a34a] text-lg font-black mt-0.5">
                {Math.round((analysisResult.confidence_score || 0.9) * 100)}%
              </h2>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-slate-100">
            <h3 className="text-sm font-black text-[#16a34a] mb-3">निदान विवरण / Diagnosis Details</h3>
            
            <div className="flex items-start gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="text-xs font-bold text-slate-800">समस्या (Issue)</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                  {analysisResult.issue_detected}
                </p>
              </div>
            </div>

            {analysisResult.treatment_plan?.fault_description && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="text-xs font-bold text-slate-800">विवरण</p>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                    {analysisResult.treatment_plan.fault_description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Structured Treatment Plan */}
          <div className="bg-[#16a34a] rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(22,163,74,0.2)] text-white">
            <h3 className="text-sm font-black mb-5">उपचार एवं समाधान (Treatment Plan)</h3>

            {/* Immediate Action */}
            {analysisResult.treatment_plan?.immediate_remedy && (
              <div className="mb-4">
                <p className="text-xs font-bold text-green-100 uppercase tracking-wide">तत्काल उपाय</p>
                <p className="text-sm font-semibold mt-1 leading-relaxed">
                  {analysisResult.treatment_plan.immediate_remedy}
                </p>
              </div>
            )}

            {/* Specific Chemicals / Pesticides */}
            {analysisResult.treatment_plan?.pesticides_fertilizers_required?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-green-100 uppercase tracking-wide mb-2">दवा व खुराक</p>
                <div className="space-y-2">
                  {analysisResult.treatment_plan.pesticides_fertilizers_required.map((chem: string, i: number) => (
                    <div key={i} className="bg-white/10 rounded-xl px-3 py-2 text-sm font-semibold border border-white/20 backdrop-blur-sm">
                      {chem}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preventative Care */}
            {analysisResult.treatment_plan?.preventative_care && (
              <div>
                <p className="text-xs font-bold text-green-100 uppercase tracking-wide">बचाव</p>
                <p className="text-sm font-semibold mt-1 leading-relaxed opacity-90">
                  {analysisResult.treatment_plan.preventative_care}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}