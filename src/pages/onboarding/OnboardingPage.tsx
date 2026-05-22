import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import {
  useDashboardData,
  updateUserProfile,
  USDT_BEP20_ADDRESS,
  USDT_BEP20_ADDRESS_DISPLAY,
  IS_USDT_BEP20_ADDRESS_CONFIGURED,
  INVESTMENT_TIERS,
} from '@/lib/dashboardData';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { 
  Sparkles, 
  User, 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  BookOpen, 
  Coins, 
  Check, 
  Copy, 
  CheckCircle2,
  TrendingUp,
  Percent,
  Wallet,
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export function OnboardingPage() {
  const { user } = useAuth();
  const { profile } = useDashboardData(user?.uid);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(profile?.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);

  // ROI Calculator state for Step 4
  const [estAmount, setEstAmount] = useState(250);

  const totalSteps = 5;

  const nextStep = () => {
    if (step === 2) {
      if (!name.trim()) {
        toast.error('Please enter your full legal name.');
        return;
      }
      if (!phone.trim()) {
        toast.error('Please enter your phone number.');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: name.trim(),
        phone: phone.trim(),
        onboardingComplete: true,
      });
      toast.success('Onboarding completed! Welcome to GoldEx.');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to complete onboarding.');
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (!IS_USDT_BEP20_ADDRESS_CONFIGURED) {
      toast.error('Deposit address is not ready yet.');
      return;
    }
    navigator.clipboard.writeText(USDT_BEP20_ADDRESS);
    toast.success('Address copied to clipboard!');
  };

  // Recommended plan based on user slider input
  const recommendedPlan = INVESTMENT_TIERS.find(
    (tier) => estAmount >= tier.minAmount && estAmount <= tier.maxAmount
  ) || INVESTMENT_TIERS[0];

  const estimatedDailyProfit = estAmount * recommendedPlan.dailyRateMin;
  const estimatedMonthlyProfit = estimatedDailyProfit * 30;

  const progressPercentage = (step / totalSteps) * 100;

  // Slide animations config
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-surface-base dark:bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Background decoration orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-gold/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10 px-4">
        {/* Header Branding */}
        <div className="flex justify-center mb-8">
          <img 
            src="/images/Navbar.png" 
            alt="GoldEx Logo" 
            className="h-10 w-auto object-contain filter drop-shadow-[0_0_12px_rgba(212,175,55,0.25)]" 
          />
        </div>

        {/* Wizard Card Container */}
        <Card className="relative p-6 sm:p-10 border border-neutral-200/60 dark:border-neutral-800/40 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold">
                Setup Wizard
              </span>
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Step {step} of {totalSteps}
              </span>
            </div>
            <ProgressBar value={progressPercentage} className="h-1.5" />
          </div>

          <div className="relative min-h-[350px] flex flex-col justify-between">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="flex-1 flex flex-col"
              >
                {/* STEP 1: WELCOME & SIGNUP BONUS */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 dark:bg-brand-gold/20 flex items-center justify-center mb-4 shadow-inner">
                        <Sparkles className="w-8 h-8 text-brand-gold animate-pulse" />
                      </div>
                      <h2 className="text-2xl font-bold font-display text-neutral-900 dark:text-neutral-50">
                        Welcome to GoldEx
                      </h2>
                      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                        Start investing in gold-linked assets and earn daily profit.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-gold/15 via-brand-gold/5 to-transparent border border-brand-gold/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-15">
                        <Coins className="w-16 h-16 text-brand-gold" />
                      </div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="gold" text="Bonus Locked" className="text-[10px] py-0.5 px-2" />
                          <span className="text-xs text-brand-gold font-semibold uppercase tracking-wider">Promo Offer</span>
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                          $10.00 Signup Reward
                        </h3>
                        <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          We have reserved a $10.00 signup bonus for you. It will be added to your account and starts earning once you make your first deposit.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 p-4 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        <strong className="text-neutral-800 dark:text-neutral-200">Security:</strong> All deposits are verified on-chain through BscScan. Your data is encrypted end-to-end.
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: PROFILE FORM */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="text-center sm:text-left">
                      <h2 className="text-2xl font-bold font-display text-neutral-900 dark:text-neutral-50">
                        Personalize Profile
                      </h2>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Please provide your real legal details to ensure smooth payouts and compliant records.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Input
                        label="Full Legal Name"
                        id="legalName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. John Doe"
                        leftIcon={<User className="w-4 h-4 text-neutral-400" />}
                        required
                      />

                      <Input
                        label="WhatsApp / Phone Number"
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +1 (555) 000-0000"
                        leftIcon={<Phone className="w-4 h-4 text-neutral-400" />}
                        required
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-600 dark:text-amber-500/80 leading-relaxed">
                      💡 Ensure the WhatsApp number is correct. Important deposit confirmations and account safety alerts will be sent here.
                    </div>
                  </div>
                )}

                {/* STEP 3: EXPLAINER DIAGRAMS */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold font-display text-neutral-900 dark:text-neutral-50">
                        How GoldEx Works
                      </h2>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Three simple steps to start earning.
                      </p>
                    </div>

                    <div className="space-y-4 py-2">
                      <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center font-bold text-sm text-brand-gold flex-shrink-0">
                          1
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                            Deposit USDT BEP20
                          </h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                            Send USDT on the BSC (BEP20) network to your deposit address. No hidden fees.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center font-bold text-sm text-brand-gold flex-shrink-0">
                          2
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                            Choose Your Plan
                          </h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                            Pick from Starter, Growth, or Elite tiers based on your investment amount. Each tier has its own daily earning rate.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center font-bold text-sm text-brand-gold flex-shrink-0">
                          3
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                            Collect Daily Payouts
                          </h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                            Your profit grows automatically every day. Withdraw to your USDT BEP20 wallet once you reach the $50 minimum.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: RECOMMENDATIONS & SLIDER */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="text-center sm:text-left">
                      <h2 className="text-2xl font-bold font-display text-neutral-900 dark:text-neutral-50">
                        Compare Investments
                      </h2>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Adjust the slider to see estimated daily returns for different amounts.
                      </p>
                    </div>

                    {/* Slider & Calculator Card */}
                    <div className="p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            Investment Target
                          </span>
                          <span className="text-lg font-bold font-mono text-brand-gold">
                            ${estAmount}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="10000"
                          step="50"
                          value={estAmount}
                          onChange={(e) => setEstAmount(Number(e.target.value))}
                          className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                        />
                        <div className="flex justify-between text-[10px] text-neutral-400 dark:text-neutral-600 mt-1 font-mono">
                          <span>$50</span>
                          <span>$5,000</span>
                          <span>$10,000+</span>
                        </div>
                      </div>

                      {/* Yield Projections */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 shadow-sm text-center">
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">Est. Daily Profit</span>
                          <span className="text-sm font-semibold text-emerald-500 font-mono">
                            +${estimatedDailyProfit.toFixed(2)}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 shadow-sm text-center">
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">Est. 30-Day Profit</span>
                          <span className="text-sm font-semibold text-emerald-500 font-mono">
                            +${estimatedMonthlyProfit.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Tier Tag Recommendation */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-brand-gold/15 bg-brand-gold/5">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-brand-gold" />
                          <span className="text-xs text-neutral-700 dark:text-neutral-300">
                            Recommended Tier:
                          </span>
                        </div>
                        <Badge variant="gold" text={`${recommendedPlan.name} Plan`} className="font-semibold px-2 py-0.5" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100/50 dark:bg-neutral-900/10 p-3 rounded-lg border border-neutral-200/20">
                      <div className="flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Daily Rate Scale:</span>
                      </div>
                      <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                        {(recommendedPlan.dailyRateMin * 100).toFixed(1)}% - {(recommendedPlan.dailyRateMax * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* STEP 5: DEPOSIT ADDRESS & COMPLETE */}
                {step === 5 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold font-display text-neutral-900 dark:text-neutral-50">
                        Fund Your Wallet
                      </h2>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Transfer USDT to begin earning daily interest.
                      </p>
                    </div>

                    {/* QR Code and Wallet display */}
                    <div className="flex flex-col items-center space-y-4">
                      {/* QR Image */}
                      <div className="p-3 bg-white rounded-2xl border border-neutral-200 shadow-sm relative group overflow-hidden">
                        {IS_USDT_BEP20_ADDRESS_CONFIGURED ? (
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(USDT_BEP20_ADDRESS)}`}
                            alt="USDT BEP20 QR Code"
                            className="w-40 h-40 object-contain"
                          />
                        ) : (
                          <div className="w-40 h-40 flex flex-col items-center justify-center gap-2 text-center bg-neutral-50 text-neutral-500">
                            <Wallet className="w-8 h-8 text-brand-gold" />
                            <span className="text-xs font-semibold px-3">Address pending</span>
                          </div>
                        )}
                      </div>

                      {/* Address string */}
                      <div className="w-full">
                        <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 text-center">
                          USDT BEP20 Address
                        </label>
                        <div className="flex items-center bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200 dark:border-neutral-800 p-1.5">
                          <span className="flex-1 text-xs font-mono font-bold select-all overflow-x-auto whitespace-nowrap px-3 text-neutral-800 dark:text-neutral-300 scrollbar-none text-center">
                            {USDT_BEP20_ADDRESS_DISPLAY}
                          </span>
                          <button
                            onClick={copyAddress}
                            disabled={!IS_USDT_BEP20_ADDRESS_CONFIGURED}
                            className="p-2 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 rounded-lg text-neutral-500 hover:text-brand-gold border border-neutral-200/60 dark:border-neutral-700/40 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/5 text-[11px] text-rose-600 dark:text-rose-500/80 leading-relaxed text-center">
                      {IS_USDT_BEP20_ADDRESS_CONFIGURED
                        ? 'Send only USDT BEP20 (Binance Smart Chain) to this address. Funds sent to other networks will be permanently lost.'
                        : 'Your deposit address is being configured. Please wait for the live address before sending funds.'}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-neutral-200/50 dark:border-neutral-800/40">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={step === 1}
                className={`flex items-center gap-2 h-11 px-4 ${
                  step === 1 ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>

              {step < totalSteps ? (
                <Button
                  variant="primary"
                  onClick={nextStep}
                  className="flex items-center gap-2 h-11 px-6 bg-brand-gold hover:bg-brand-gold-light text-neutral-950 font-semibold shadow-lg shadow-brand-gold/25"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleComplete}
                  loading={loading}
                  className="flex items-center gap-2 h-11 px-6 bg-brand-gold hover:bg-brand-gold-light text-neutral-950 font-semibold shadow-lg shadow-brand-gold/25"
                >
                  <Check className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
