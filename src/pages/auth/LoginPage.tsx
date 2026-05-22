import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Forgot password modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: otp + password
  const [resetLoading, setResetLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    try {
      await loginWithGoogle();
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Google login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenResetModal = () => {
    setResetEmail('');
    setResetOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setResetStep(1);
    setShowResetModal(true);
  };

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP code.');
      toast.success('Password reset verification code sent to your email.');
      setResetStep(2);
    } catch (error: any) {
      toast.error(error.message || 'Could not send verification code.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetOtp) return;
    setResetLoading(true);
    try {
      const response = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invalid verification code.');
      toast.success('OTP code verified successfully!');
      setResetStep(3);
    } catch (error: any) {
      toast.error(error.message || 'OTP verification failed.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetOtp || !newPassword) return;
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setResetLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          otp: resetOtp,
          newPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to reset password');
      toast.success('Password updated successfully! Please sign in.');
      setShowResetModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Error updating password.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="max-w-[380px] mx-auto w-full">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="lg:hidden mb-6 flex items-center justify-center w-[40px] h-[46px]">
          <img src="/images/icon.png" alt="GoldEx" className="w-[40px] h-[46px] object-contain drop-shadow-[0_4px_12px_rgba(212,175,55,0.4)]" />
        </div>
        <h2 className="font-display font-bold text-[32px] text-white tracking-tight mb-[6px]">Welcome back</h2>
        <p className="font-sans text-[14px] text-text-muted">Sign in to your account</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-[18px] flex flex-col w-full">
        {/* Email Field */}
        <div className="auth-field">
          <label className="auth-label">Email address</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            placeholder="you@example.com"
          />
        </div>

        {/* Password Field */}
        <div className="auth-field">
          <label className="auth-label">Password</label>
          <div className="relative">
          <input 
            type={showPassword ? "text" : "password"} 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input w-full pr-[50px]"
            placeholder="Enter password"
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)} 
            className="absolute inset-y-0 right-[14px] flex items-center text-gold-500/50 hover:text-gold-500 transition-colors p-1"
          >
            {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
          </button>
          </div>
        </div>
        
        <div className="flex justify-end mt-[-8px] mb-[4px]">
          <button type="button" onClick={handleOpenResetModal} className="font-sans text-[13px] text-gold-500 hover:text-gold-400">Forgot password?</button>
        </div>

        <button type="submit" disabled={submitting} className="btn-gold w-full h-[54px] rounded-[12px] text-[16px] disabled:opacity-60">
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
        
        {/* OR Divider */}
        <div className="relative py-4 flex items-center justify-center">
          <div className="absolute border-t border-[#D4AF37]/12 w-full" />
          <span className="bg-[#07070D] border border-[#D4AF37]/10 rounded-full px-3 py-0.5 text-[12px] font-sans font-medium text-text-muted relative z-10">OR</span>
        </div>

        <button type="button" onClick={handleGoogleLogin} disabled={submitting} className="btn-ghost w-full h-[54px] rounded-[12px] flex items-center justify-center gap-3 disabled:opacity-60">
          <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            <path d="M1 1h22v22H1z" fill="none"/>
          </svg>
          <span className="text-[#E8E4D4]">Continue with Google</span>
        </button>

        <p className="text-center font-sans text-[14px] text-text-secondary mt-8">
          No account? <Link to="/register" className="text-gold-500 font-medium relative group">
            Start trading <span className="inline-block transform transition-transform group-hover:translate-x-1">→</span>
            <span className="absolute bottom-[-2px] left-0 w-full h-[1px] bg-gold-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </Link>
        </p>
      </form>

      {/* Forgot Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(3,3,5,0.85)] backdrop-blur-md">
          <div className="bg-[#0C0C16] border border-[#D4AF37]/22 p-8 rounded-[20px] max-w-[400px] w-full relative shadow-[0_10px_50px_rgba(212,175,55,0.15)] animate-in fade-in zoom-in duration-200">
            <button 
              type="button" 
              onClick={() => setShowResetModal(false)}
              className="absolute top-5 right-5 text-text-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-bold text-[24px] text-white tracking-tight mb-2">Reset Password</h3>
            <p className="font-sans text-[14px] text-text-muted mb-6">
              {resetStep === 1 && "Enter your email address to receive a one-time password reset code."}
              {resetStep === 2 && "Enter the verification code sent to your email address."}
              {resetStep === 3 && "Choose a secure new password for your account."}
            </p>

            {resetStep === 1 && (
              <form onSubmit={handleSendResetOtp} className="space-y-[18px]">
                <div className="auth-field">
                  <label className="auth-label">Email address</label>
                  <input 
                    type="email" 
                    required 
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="auth-input w-full"
                    placeholder="you@example.com"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={resetLoading} 
                  className="btn-gold w-full h-[50px] rounded-[10px] text-[15px] disabled:opacity-60"
                >
                  {resetLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>
            )}

            {resetStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-[18px]">
                <div className="auth-field">
                  <label className="auth-label">Verification Code</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    className="auth-input w-full font-mono text-center tracking-[4px] text-[18px]"
                    placeholder="000000"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={resetLoading} 
                  className="btn-gold w-full h-[50px] rounded-[10px] text-[15px] disabled:opacity-60"
                >
                  {resetLoading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setResetStep(1)} 
                  className="w-full text-center text-xs text-gold-500/70 hover:text-gold-500 mt-2 transition-colors"
                >
                  Change Email Address
                </button>
              </form>
            )}

            {resetStep === 3 && (
              <form onSubmit={handleVerifyAndResetPassword} className="space-y-[18px]">
                <div className="auth-field">
                  <label className="auth-label">New Password</label>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      required 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="auth-input w-full pr-[45px]"
                      placeholder="At least 6 characters"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-[14px] flex items-center text-gold-500/50 hover:text-gold-500 transition-colors p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-[16px] h-[16px]" /> : <Eye className="w-[16px] h-[16px]" />}
                    </button>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Confirm Password</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      required 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="auth-input w-full pr-[45px]"
                      placeholder="Repeat password"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-[14px] flex items-center text-gold-500/50 hover:text-gold-500 transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-[16px] h-[16px]" /> : <Eye className="w-[16px] h-[16px]" />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={resetLoading} 
                  className="btn-gold w-full h-[50px] rounded-[10px] text-[15px] disabled:opacity-60"
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
