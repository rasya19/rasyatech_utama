import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    // Show splash for 2.6 seconds, then trigger the fade out
    const timer = setTimeout(() => {
      setMounted(false);
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {mounted && (
        <motion.div
          id="custom-splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B2447] select-none"
        >
          {/* Subtle glowing ambient background lights */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18)_0%,transparent_70%)] pointer-events-none" />

          <div className="flex flex-col items-center text-center px-6 max-w-md relative z-10">
            {/* Elegant logo container with bounce-less scaling and fade-in */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-36 h-36 md:w-44 md:h-44 mb-6 flex items-center justify-center"
            >
              {/* Outer pulsing decoration ring */}
              <div className="absolute inset-0 rounded-full bg-white/5 animate-pulse duration-2000" />
              <div className="absolute -inset-2 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
              
              <img
                id="splash-logo"
                src="/icon-512x512.png"
                alt="RasyaTech Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain relative z-10"
              />
            </motion.div>

            {/* Main title */}
            <motion.h1
              id="splash-title"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-white text-3xl md:text-4xl font-extrabold tracking-tight mb-2"
            >
              RasyaTech
            </motion.h1>

            {/* Slogan */}
            <motion.p
              id="splash-slogan"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-cyan-100/85 font-medium text-sm md:text-base tracking-wide"
            >
              Innovating the Future of Learning
            </motion.p>

            {/* Smooth animated loader row at bottom */}
            <div className="w-32 h-[3px] bg-white/10 rounded-full overflow-hidden mt-8">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.1, duration: 2.3, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
