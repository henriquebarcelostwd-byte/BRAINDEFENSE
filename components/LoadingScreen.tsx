
import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
  assets: string[];
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete, assets }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let loaded = 0;
    // Deduplicate assets to avoid loading same URL twice
    const uniqueAssets: string[] = Array.from(new Set(assets));
    const uniqueTotal = uniqueAssets.length;
    let completed = false;

    const finish = () => {
        if (completed) return;
        completed = true;
        onComplete();
    };

    if (uniqueTotal === 0) {
      finish();
      return;
    }

    const updateProgress = () => {
      loaded++;
      const percent = Math.floor((loaded / uniqueTotal) * 100);
      setProgress(percent);

      if (loaded >= uniqueTotal) {
        // Small buffer to ensure render catches up
        setTimeout(finish, 500);
      }
    };

    uniqueAssets.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = updateProgress;
      img.onerror = updateProgress; // Continue even if one fails
    });

    // SAFETY TIMEOUT: Force start after 5 seconds if assets hang
    // Increased timeout to prevent premature firing on slow connections
    // Removed console.warn to avoid alarming the user
    const timer = setTimeout(() => {
        if (!completed) {
            finish();
        }
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete, assets]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <h1 className="text-6xl font-spooky text-purple-600 mb-8 animate-pulse">
        BRAINDEFENSE
      </h1>
      
      {/* Loading Bar Container */}
      <div className="w-64 h-8 border-4 border-white p-1">
        {/* Fill */}
        <div 
          className="h-full bg-white transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-4 text-white font-mono text-sm">
        LOADING ASSETS... {progress}%
      </p>
    </div>
  );
};

export default LoadingScreen;
