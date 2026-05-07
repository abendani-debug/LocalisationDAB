import { useRef, useState } from 'react';

export default function SplashScreen({ onDone }) {
  const [fadeOut, setFadeOut] = useState(false);
  const videoRef = useRef(null);

  const handleEnd = () => {
    setFadeOut(true);
    setTimeout(() => onDone(), 500);
  };

  // Fallback si la vidéo ne charge pas
  const handleError = () => {
    setTimeout(() => { setFadeOut(true); setTimeout(() => onDone(), 500); }, 2500);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black transition-opacity duration-500"
      style={{ opacity: fadeOut ? 0 : 1 }}
    >
      <video
        ref={videoRef}
        src="/open_screen.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleEnd}
        onError={handleError}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}
