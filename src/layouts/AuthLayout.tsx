import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { motion, AnimatePresence } from 'framer-motion';

export function AuthLayout() {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen flex text-[#E8E4D4]">
      {/* Left side (Desktop Background & Aurora) */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-[#030305] flex-col justify-between">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img src="/images/Login Page Left Panel Background.png" alt="Auth Background" className="w-full h-full object-cover opacity-80 mix-blend-screen" />
        </div>

        {/* Top left Home Link */}
        <div className="p-8 relative z-10">
          <Link to="/" className="flex items-center gap-[10px] group w-max">
            <img src="/images/Navbar.png" alt="GoldEx" className="h-[40px] w-auto object-contain transform scale-[2.5] origin-left group-hover:scale-[2.6] transition-transform" />
          </Link>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-12">
           <img src="/images/icon.png" alt="GoldEx" className="mb-10 w-[80px] h-[92px] object-contain drop-shadow-[0_4px_16px_rgba(212,175,55,0.4)]" />

           <h1 className="font-display font-black text-[48px] leading-[1.1] text-gold mb-[10px]">
             {isLogin ? "GoldEx Account" : "Create Your Account"}
           </h1>
           <p className="font-sans text-[18px] text-text-secondary max-w-[420px]">
             {isLogin ? "Welcome back to your live-data trading dashboard." : "Create your account to use verified balances, live records, and USDT BEP20 deposits."}
           </p>

           <div className="mt-12 flex justify-center w-full">
              <img src="/images/Auth Floating Stat Cards Visual.png" alt="Verified Stats" className="w-[320px] h-auto object-contain opacity-90 drop-shadow-[0_4px_16px_rgba(212,175,55,0.2)]" />
           </div>
        </div>

        <div className="p-12 relative z-10 text-center">
          <p className="font-display italic text-[18px] text-[#E8E4D4]/50">
            "Gold is the money of kings, silver is the money of gentlemen."
          </p>
        </div>
      </div>

      {/* Right side (Form Container) */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center relative bg-[rgba(7,7,13,0.95)]">
        <div className="absolute top-6 left-6 lg:hidden">
           <Link to="/" className="flex items-center gap-[6px] text-text-muted hover:text-white transition-colors cursor-none">
              <ArrowLeft className="w-5 h-5" /> <span className="font-sans font-medium text-[14px]">Home</span>
           </Link>
        </div>

        <div className="w-full relative px-6 md:px-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
