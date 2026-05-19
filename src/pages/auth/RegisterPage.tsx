import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referral, setReferral] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, loginWithGoogle } = useAuth();
  React.useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferral(ref.toUpperCase());
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setSubmitting(true);
    try {
      await register({ name, email, password, referral });
      await sendEmail('registration', { to: email, name });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Could not create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setSubmitting(true);
    try {
      const googleUser = await loginWithGoogle();
      await sendEmail('registration', { to: googleUser.email, name: googleUser.displayName || 'Google user' });
      toast.success('Account ready!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Google sign up failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[380px] mx-auto w-full py-12 lg:py-0">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="lg:hidden mb-6 flex items-center justify-center w-[40px] h-[46px]">
          <svg width="40" height="46" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0L23.2583 6.5V19.5L12 26L0.741669 19.5V6.5L12 0Z" fill="url(#grad-sm-logo-reg)" />
            <path d="M15.5 17H8.5V9H15.5" stroke="#07070D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="grad-sm-logo-reg" x1="0" y1="0" x2="24" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFE680" />
                <stop offset="40%" stopColor="#F5C518" />
                <stop offset="70%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#FFD700" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h2 className="font-display font-bold text-[32px] text-white tracking-tight mb-[6px]">Create Account</h2>
        <p className="font-sans text-[14px] text-text-muted">Create an account for live verified records</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-[16px] flex flex-col w-full">
        {/* Name Field */}
        <div className="auth-field">
          <label className="auth-label">Full name</label>
          <input 
            type="text" 
            required 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="auth-input"
            placeholder="Your name"
          />
        </div>

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
          <label className="auth-label">Password (min 8 chars)</label>
          <div className="relative">
          <input 
            type={showPassword ? "text" : "password"} 
            required 
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input w-full pr-[50px]"
            placeholder="Create password"
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

        {/* Referral Field */}
        <div className="auth-field">
          <label className="auth-label">Referral Code (Optional)</label>
          <input 
            type="text" 
            value={referral}
            onChange={(e) => setReferral(e.target.value)}
            className="auth-input uppercase font-mono"
            placeholder="CODE"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-gold w-full h-[54px] rounded-[12px] text-[16px] mt-2 disabled:opacity-60">
          {submitting ? 'Creating account...' : 'Create Account'}
        </button>
        
        {/* OR Divider */}
        <div className="relative py-2 flex items-center justify-center">
          <div className="absolute border-t border-[#D4AF37]/12 w-full" />
          <span className="bg-[#07070D] border border-[#D4AF37]/10 rounded-full px-3 py-0.5 text-[12px] font-sans font-medium text-text-muted relative z-10">OR</span>
        </div>

        <button type="button" onClick={handleGoogleSignup} disabled={submitting} className="btn-ghost w-full h-[54px] rounded-[12px] flex items-center justify-center gap-3 disabled:opacity-60">
          <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            <path d="M1 1h22v22H1z" fill="none"/>
          </svg>
          <span className="text-[#E8E4D4]">Sign up with Google</span>
        </button>

        <p className="text-center font-sans text-[14px] text-text-secondary mt-6">
          Already have an account? <Link to="/login" className="text-gold-500 font-medium relative group cursor-none">
            Sign in
            <span className="absolute bottom-[-2px] left-0 w-full h-[1px] bg-gold-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </Link>
        </p>
      </form>
    </div>
  );
}
