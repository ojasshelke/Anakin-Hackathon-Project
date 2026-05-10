import React, { useCallback, useState } from "react";
import { UploadCloud, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";

const PLACEHOLDER_MODEL = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80";

export default function ImageUpload() {
  const { userImage, setUserImage, setUserPhotoUrl, currentUser } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 3D Parallax hook values...
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the movement
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  // Transform coordinates to rotation angles (tilt effect)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);
  
  // Parallax shifts for layers
  const backgroundX = useTransform(mouseXSpring, [-0.5, 0.5], ["-3%", "3%"]);
  const backgroundY = useTransform(mouseYSpring, [-0.5, 0.5], ["-3%", "3%"]);
  
  const foregroundX = useTransform(mouseXSpring, [-0.5, 0.5], ["3%", "-3%"]);
  const foregroundY = useTransform(mouseYSpring, [-0.5, 0.5], ["3%", "-3%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calculate normalized mouse position from -0.5 to 0.5
    const normalizedX = (e.clientX - rect.left) / width - 0.5;
    const normalizedY = (e.clientY - rect.top) / height - 0.5;

    x.set(normalizedX);
    y.set(normalizedY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const currentImage = userImage || PLACEHOLDER_MODEL;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    
    // 0. Resize image to max 1024px for performance and API limits
    const resizeImage = (imgFile: File): Promise<Blob> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const max = 768;
            
            if (width > height) {
              if (width > max) {
                height *= max / width;
                width = max;
              }
            } else {
              if (height > max) {
                width *= max / height;
                height = max;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => resolve(blob || imgFile), 'image/jpeg', 0.6);
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(imgFile);
      });
    };

    const processedBlob = await resizeImage(file);
    const processedFile = new File([processedBlob], file.name, { type: 'image/jpeg' });

    // 1. Set local preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUserImage(result);
      // Fallback: set photo URL to base64 immediately so button is clickable
      setUserPhotoUrl(result);
    };
    reader.readAsDataURL(processedFile);

    // 2. Upload to our API (Cloudflare R2)
    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const formData = new FormData();
      formData.append('file', processedFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Upload API failed: ${res.status}`);
      }

      const uploadData = await res.json();
      if (uploadData.url) {
        // Overwrite base64 with cleaner permanent URL
        setUserPhotoUrl(uploadData.url);
      }
    } catch (err) {
      console.warn("Server upload failed, using local data URL instead:", err);
      // Keep using the base64 preview set in step 1
    } finally {
      setIsUploading(false);
    }
  }, [currentUser, setUserImage, setUserPhotoUrl]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#bef264]/20 flex items-center justify-center">
            <span className="text-[#a3e635] font-semibold">1</span>
          </div>
          <h2 className="text-xl font-medium text-white/90 tracking-wide">
            {userImage ? "Your Mirror" : "Upload Photo"}
          </h2>
        </div>
        
        {userImage && (
          <button 
            onClick={() => { setUserImage(null); setUserPhotoUrl(null); }}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      <div 
        className="relative w-full aspect-[3/4] sm:aspect-auto sm:h-[500px] perspective-[1000px] group cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
          accept="image/*"
          id="file-upload"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        
        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="w-full h-full relative glass-panel border border-[#bef264]/20 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-shadow duration-300 hover:shadow-[0_40px_80px_rgba(190,242,100,0.15)]"
        >
          {/* Depth effect: Blurred Background copy moving opposite direction */}
          <motion.div 
            style={{ x: backgroundX, y: backgroundY }}
            className="absolute inset-[-10%] w-[120%] h-[120%] z-0"
          >
            <img 
              src={currentImage} 
              alt="Depth background"
              className="w-full h-full object-cover blur-2xl opacity-60 mix-blend-screen scale-110"
            />
          </motion.div>

          {/* Main Focused Image moving forward slightly */}
          <motion.div 
            style={{ x: foregroundX, y: foregroundY }}
            className={`absolute inset-0 w-full h-full z-10 transition-transform duration-700 ease-out group-hover:scale-[1.03] ${(!userImage || isUploading) && 'filter grayscale-[0.8] contrast-125'}`}
          >
            <img 
              src={currentImage} 
              alt="Mirror Target" 
              className="w-full h-full object-cover shadow-2xl drop-shadow-2xl rounded-2xl" 
            />
          </motion.div>

          {/* Glare and Lighting overlay */}
          <div className="absolute inset-0 z-20 bg-gradient-to-tr from-black/60 via-transparent to-white/10 pointer-events-none mix-blend-overlay" />
          
          <div className="absolute inset-0 z-30 transition-opacity duration-500 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* HUD Overlay */}
          <div className="absolute inset-0 z-40 p-6 flex flex-col justify-end pointer-events-none">
            {isUploading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center mt-auto mb-auto bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-white/10 mx-4 pointer-events-auto">
                <Loader2 className="w-8 h-8 text-[#bef264] animate-spin" />
                <p className="text-white font-medium">Scanning Profile...</p>
              </div>
            ) : !userImage ? (
              <AnimatePresence>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-4 text-center mt-auto mb-auto bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 mx-4 pointer-events-auto shadow-2xl"
                >
                  <label htmlFor="file-upload" className="w-16 h-16 rounded-full bg-[#bef264]/90 flex items-center justify-center hover:scale-110 shadow-[0_0_30px_rgba(190,242,100,0.6)] cursor-pointer transition-transform duration-300">
                    <UploadCloud className="w-8 h-8 text-black" />
                  </label>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1 tracking-wide">Activate Mirror Mode</h3>
                    <p className="text-white/60 text-sm">Drag & drop or tap to step into the studio</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between pointer-events-auto"
              >
                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold tracking-wide text-white">Mirror Active</span>
                </div>
                
                <label htmlFor="file-upload" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 text-sm font-medium backdrop-blur-md border border-white/5 transition-colors cursor-pointer">
                  Change Photo
                </label>
              </motion.div>
            )}
          </div>
          
          {/* Drag dropping overlay state */}
          {isDragging && !isUploading && (
            <div className="absolute inset-0 z-50 bg-[#bef264]/20 backdrop-blur-sm border-2 border-[#bef264] border-dashed rounded-2xl flex items-center justify-center flex-col gap-4 pointer-events-none">
              <UploadCloud className="w-12 h-12 text-[#bef264] animate-bounce" />
              <h3 className="text-[#a3e635] font-bold text-2xl drop-shadow-md">Drop to scan</h3>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
