import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Heart, HeartHandshake, ShieldCheck } from "lucide-react";

interface SplashIntroProps {
  onEnter: () => void;
}

export default function SplashIntro({ onEnter }: SplashIntroProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 1000);
    const timer2 = setTimeout(() => setStep(2), 2500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#F9F8F6] text-[#2D2D2D] flex flex-col items-center justify-center overflow-hidden">
      {/* Abstract luxury ambient circles */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #D4AF37 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="max-w-xl px-6 text-center z-10 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center justify-center"
            >
              <Heart className="w-16 h-16 text-[#D4AF37] animate-pulse drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]" />
              <p className="mt-4 font-mono text-[#D4AF37]/60 tracking-[0.3em] uppercase text-xs">Connecting Hearts</p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center"
            >
              <div className="inline-flex p-4 rounded-full bg-[#FFF4E5] border border-[#FFE0B2] mb-4 shadow-sm animate-pulse text-[#D4AF37]">
                <HeartHandshake className="w-12 h-12" />
              </div>
              <h2 className="text-xl md:text-2xl font-serif text-[#1A1A1A] font-bold tracking-tight">
                Because No One Deserves to Feel Lonely
              </h2>
              <p className="mt-2 text-gray-500 text-xs sm:text-sm max-w-sm">
                Authentic companionship services centered around physical safety, mutual respect, and emotional support.
              </p>
            </motion.div>
          )}

          {step >= 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.0, ease: "easeOut" }}
              className="flex flex-col items-center justify-center animate-fade-in"
            >
              {/* Premium Luxury Logo */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#D4AF37]/10 rounded-full blur-2xl animate-pulse" />
                <div className="relative inline-flex p-5 rounded-full bg-white border border-[#E5E1D8] shadow-md">
                  <Sparkles className="w-14 h-14 text-[#D4AF37] animate-spin" style={{ animationDuration: "12s" }} />
                </div>
              </div>

              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-serif font-bold text-[#1A1A1A] tracking-tight"
              >
                Yarana<span className="text-[#D4AF37]">.pk</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-3 text-base md:text-lg text-gray-600 font-semibold tracking-wide max-w-md"
              >
                Premium Companionship Marketplace
              </motion.p>

              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-2 text-xs md:text-sm text-gray-400 max-w-sm"
              >
                Find vetted friendly hosts for dinners, cinema companions, phone calls, travel guides, or academic study sessions.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="mt-8 flex flex-col gap-4 w-full sm:w-auto"
              >
                <button
                  onClick={onEnter}
                  className="px-8 py-4 bg-[#1A1C20] hover:bg-[#D4AF37] text-white hover:text-black font-semibold text-sm uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer border-0"
                  id="btn-splash-enter"
                >
                  Enter Marketplace
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  100% Verified, Safe, &amp; Respectful
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Decorative premium footer */}
      <div className="absolute bottom-6 font-mono text-[9px] text-[#D4AF37]/60 tracking-[0.25em] uppercase font-bold">
        Yarana.pk &copy; 2026 &bull; Locked Admin Pricing Controls
      </div>
    </div>
  );
}
