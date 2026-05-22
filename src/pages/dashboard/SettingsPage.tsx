import React, { useEffect, useState } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  FileCheck, 
  AlertTriangle, 
  LogOut, 
  WalletCards, 
  Database, 
  MailCheck, 
  Trash2, 
  Download, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Key,
  ShieldAlert,
  Smartphone,
  Eye,
  Trash
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import {
  buildAccountExport,
  downloadJson,
  requestAccountDeletion,
  submitKycRequest,
  submitWalletWhitelistRequest,
  updateUserProfile,
  useDashboardData,
  useLedgerEntries,
  useWalletWhitelist,
} from '@/lib/dashboardData';
import { sendEmail } from '@/lib/email';
import { Card, Badge, Button } from '@/components/ui';

const compressImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.7 quality to keep it light
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [prefs, setPrefs] = useState({ profit: true, referral: true, withdraw: true, ai: false, security: true, marketing: false });
  const [kycForm, setKycForm] = useState({
    legalName: '',
    country: '',
    documentType: 'passport',
    documentNumber: '',
    dob: '',
    expiryDate: '',
    documentUrl: '',
    backDocumentUrl: '',
    verified: false,
    notes: ''
  });
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [analyzingDoc, setAnalyzingDoc] = useState(false);
  const [walletForm, setWalletForm] = useState({ label: '', address: '' });
  const { user, logout, resetPassword, sendVerificationEmail, refreshUser } = useAuth();
  const { profile, investments, deposits, withdrawals } = useDashboardData(user?.uid);
  const { wallets } = useWalletWhitelist(user?.uid);
  const { entries: ledgerEntries } = useLedgerEntries(user?.uid, 200);

  useEffect(() => {
    setDisplayName(profile?.displayName || user?.displayName || '');
    setPhone(profile?.phone || '');
    setPrefs({
      profit: profile?.notificationPrefs?.profit ?? true,
      referral: profile?.notificationPrefs?.referral ?? true,
      withdraw: profile?.notificationPrefs?.withdraw ?? true,
      ai: profile?.notificationPrefs?.ai ?? false,
      security: profile?.notificationPrefs?.security ?? true,
      marketing: profile?.notificationPrefs?.marketing ?? false,
    });
  }, [profile, user]);

  const navItems = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'notifications', label: 'Alert Preferences', icon: Bell },
    { id: 'kyc', label: 'Identity KYC', icon: FileCheck },
    { id: 'wallets', label: 'USDT Whitelist', icon: WalletCards },
    { id: 'data', label: 'Data Management', icon: Database },
  ];

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { displayName: displayName.trim(), phone: phone.trim() || null });
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Profile update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { notificationPrefs: prefs });
      toast.success('Notification preferences saved');
    } catch (error: any) {
      toast.error(error.message || 'Preferences update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return toast.error('No email is attached to this account.');
    try {
      await resetPassword(user.email);
      try {
        await sendEmail('password_reset', { to: user.email, name: profile?.displayName || user.displayName || user.email });
      } catch (emailErr) {
        console.warn('Reset email dispatch failed:', emailErr);
      }
      toast.success('Password reset link sent to your email.');
    } catch (error: any) {
      toast.error(error.message || 'Could not send reset email');
    }
  };

  const handleEmailVerification = async () => {
    try {
      await sendVerificationEmail();
      toast.success('Verification link dispatched.');
    } catch (error: any) {
      toast.error(error.message || 'Could not send verification email');
    }
  };

  const handleRefreshUser = async () => {
    await refreshUser();
    toast.success('Account status synchronized with Firebase.');
  };

  const handleDocumentUpload = async (side: 'front' | 'back', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingDoc(true);
    try {
      let resultUrl = '';
      try {
        const upload = await uploadToCloudinary(file, `goldex/kyc/${user.uid}`);
        resultUrl = upload.secure_url;
        toast.success(`${side === 'front' ? 'Front' : 'Back'} side uploaded.`);
      } catch (cloudinaryErr: any) {
        console.warn('Cloudinary failed, falling back to base64 encoding:', cloudinaryErr);
        const base64 = await compressImageToBase64(file);
        resultUrl = base64;
        toast.success(`${side === 'front' ? 'Front' : 'Back'} side processed locally.`);
      }

      setKycForm(prev => ({
        ...prev,
        [side === 'front' ? 'documentUrl' : 'backDocumentUrl']: resultUrl
      }));
    } catch (error: any) {
      toast.error(error.message || 'Failed to process document file.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!user) return;
    if (!kycForm.documentUrl) {
      return toast.error('Please upload the front side of your document.');
    }
    if (kycForm.documentType !== 'passport' && !kycForm.backDocumentUrl) {
      return toast.error('Please upload the back side of your document.');
    }

    setAnalyzingDoc(true);
    try {
      const res = await fetch('/api/kyc/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentUrl: kycForm.documentUrl,
          backDocumentUrl: kycForm.backDocumentUrl || undefined,
          documentType: kycForm.documentType
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'AI analysis failed');
      }

      const result = await res.json();

      setKycForm(prev => ({
        ...prev,
        legalName: result.legalName || '',
        country: result.country || '',
        documentNumber: result.documentNumber || '',
        dob: result.dob || '',
        expiryDate: result.expiryDate || '',
        verified: result.verified || false,
        notes: result.notes || ''
      }));

      if (result.verified) {
        toast.success('Gemini AI successfully verified both sides of your document!');
      } else {
        toast.error('AI verification failed. Please check fields manually.');
      }
    } catch (error: any) {
      toast.error(error.message || 'AI document processing failed');
    } finally {
      setAnalyzingDoc(false);
    }
  };

  const handleKycSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!kycForm.documentUrl) return toast.error('Please upload the front side of your document.');
    if (kycForm.documentType !== 'passport' && !kycForm.backDocumentUrl) return toast.error('Please upload the back side of your document.');
    if (!kycForm.legalName.trim() || !kycForm.country.trim()) return toast.error('Legal name and country are required.');
    
    setSaving(true);
    try {
      await submitKycRequest(user.uid, {
        legalName: kycForm.legalName.trim(),
        country: kycForm.country.trim(),
        documentType: kycForm.documentType,
        documentNumber: kycForm.documentNumber.trim(),
        dob: kycForm.dob,
        expiryDate: kycForm.expiryDate,
        documentUrl: kycForm.documentUrl,
        backDocumentUrl: kycForm.backDocumentUrl || undefined,
        status: kycForm.verified ? 'verified' : 'pending',
        notes: kycForm.notes || (kycForm.verified ? 'Auto-verified by Gemini AI (Front + Back)' : 'Requires admin compliance review')
      });
      toast.success(kycForm.verified ? 'KYC Auto-Verified & Activated!' : 'KYC submitted for compliance audit.');
      await refreshUser();
    } catch (error: any) {
      toast.error(error.message || 'KYC request failed');
    } finally {
      setSaving(false);
    }
  };

  const handleWalletSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await submitWalletWhitelistRequest(user.uid, walletForm.address, walletForm.label);
      toast.success('USDT wallet whitelisting requested successfully.');
      setWalletForm({ label: '', address: '' });
    } catch (error: any) {
      toast.error(error.message || 'Wallet request failed');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    const exportData = buildAccountExport(profile, investments, deposits, withdrawals, wallets, ledgerEntries);
    downloadJson(`goldex-account-export-${new Date().toISOString().slice(0, 10)}.json`, exportData);
  };

  const handleDeletionRequest = async () => {
    if (!user) return;
    const confirmed = window.confirm('Request account deletion review? This flags the account for admin processing.');
    if (!confirmed) return;
    try {
      await requestAccountDeletion(user.uid);
      toast.success('Account deletion request submitted');
    } catch (error: any) {
      toast.error(error.message || 'Deletion request failed');
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const upload = await uploadToCloudinary(file, `goldex/users/${user.uid}`);
      await updateUserProfile(user.uid, { photoURL: upload.secure_url });
      toast.success('Profile photo updated');
    } catch (error: any) {
      toast.error(error.message || 'Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 md:px-6">
      
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
          Account Settings
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Configure security, manage payout addresses, and complete identity checks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Navigation Sidebar Panel */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-3 lg:pb-0 hide-scrollbar sticky top-28 z-20">
          <Card className="p-1.5 flex flex-row lg:flex-col gap-1 w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all duration-200 text-xs font-extrabold whitespace-nowrap lg:w-full ${
                  activeTab === item.id 
                    ? 'bg-neutral-100 dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50' 
                    : 'text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 bg-transparent'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
            <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800 my-1.5 hidden lg:block" />
            <button 
              type="button"
              onClick={logout} 
              className="hidden lg:flex items-center gap-2.5 px-4 py-3 rounded-xl transition-colors text-xs font-extrabold text-neutral-400 hover:text-red-500 hover:bg-red-500/5"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out Account</span>
            </button>
          </Card>
        </div>

        {/* Dynamic Panels Area */}
        <div className="lg:col-span-9 w-full">
          
          {/* PROFILE CONFIG PANEL */}
          {activeTab === 'profile' && (
            <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">Personal Information</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Manage details linked to your GoldEx account.</p>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-5 max-w-xl">
                
                {/* Photo Upload Zone */}
                <div className="flex items-center gap-6 pb-6 border-b border-neutral-100 dark:border-neutral-800/60">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-850 border border-brand-gold/25 flex items-center justify-center overflow-hidden shrink-0 relative shadow-sm">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold font-display text-brand-gold">
                        {(displayName || 'G').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-neutral-850 dark:text-neutral-200">Avatar Image</p>
                    <p className="text-[10px] text-neutral-400">JPG or PNG formats under 2MB.</p>
                    <label className="inline-flex mt-1">
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="sr-only" />
                      <span className="bg-neutral-100 dark:bg-neutral-950 border border-neutral-250 dark:border-neutral-850 hover:bg-neutral-200 dark:hover:bg-neutral-900 cursor-pointer font-bold px-3 py-1.5 rounded-lg text-[10px] text-neutral-800 dark:text-neutral-200 inline-flex items-center transition-colors">
                        {uploading ? 'Processing photo...' : 'Select Avatar Image'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Full Name</label>
                  <input 
                    value={displayName} 
                    onChange={(event) => setDisplayName(event.target.value)} 
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs focus:outline-none text-neutral-850 dark:text-neutral-200 focus:border-brand-gold" 
                    required 
                  />
                </div>

                {/* Email (Disabled) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Email Address</label>
                  <input 
                    type="email" 
                    value={profile?.email || user?.email || ''} 
                    disabled 
                    className="w-full bg-neutral-100 dark:bg-neutral-950/40 border border-neutral-200/60 dark:border-neutral-850/60 rounded-2xl px-4 py-3 text-xs text-neutral-400 dark:text-neutral-500 font-mono cursor-not-allowed" 
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Phone Number</label>
                  <input 
                    value={phone} 
                    onChange={(event) => setPhone(event.target.value)} 
                    type="tel" 
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs focus:outline-none text-neutral-850 dark:text-neutral-200 focus:border-brand-gold" 
                    placeholder="+1 (555) 000-0000" 
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={saving} 
                  className="bg-[#D4AF37] hover:bg-brand-gold-light text-neutral-950 font-extrabold px-6 py-2.5 rounded-xl text-xs"
                >
                  {saving ? 'Saving changes...' : 'Save Profile Changes'}
                </Button>
              </form>
            </Card>
          )}

          {/* SECURITY PANEL */}
          {activeTab === 'security' && (
            <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">Security & Sign-In</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Control login verification and update access credentials.</p>
              </div>

              <div className="space-y-5 max-w-xl">
                {/* Email verify */}
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 bg-neutral-50/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-850 dark:text-neutral-200">
                    <MailCheck className="w-4.5 h-4.5 text-brand-gold" />
                    <span>Email Account Status</span>
                  </div>
                  <p className="text-[11px] text-neutral-450 leading-relaxed">
                    Verification status: {' '}
                    {user?.emailVerified ? (
                      <span className="text-emerald-500 font-extrabold uppercase tracking-wider">VERIFIED</span>
                    ) : (
                      <span className="text-amber-500 font-extrabold uppercase tracking-wider">UNVERIFIED</span>
                    )}
                  </p>
                  <div className="flex gap-2 pt-1.5">
                    {!user?.emailVerified && (
                      <Button 
                        type="button" 
                        onClick={handleEmailVerification} 
                        className="bg-[#D4AF37] hover:bg-brand-gold-light text-neutral-950 font-bold px-4 py-2 text-xs rounded-xl"
                      >
                        Resend Link
                      </Button>
                    )}
                    <Button 
                      type="button" 
                      onClick={handleRefreshUser} 
                      variant="ghost"
                      className="text-xs py-2 px-3 hover:bg-neutral-100 dark:hover:bg-neutral-850"
                    >
                      Sync Status
                    </Button>
                  </div>
                </div>

                {/* Password reset */}
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 bg-neutral-50/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-850 dark:text-neutral-200">
                    <Key className="w-4.5 h-4.5 text-brand-gold" />
                    <span>Password Management</span>
                  </div>
                  <p className="text-[11px] text-neutral-440 leading-relaxed">
                    Trigger a secure password override. We will transmit an override dispatch link to your current email.
                  </p>
                  <Button 
                    type="button" 
                    onClick={handlePasswordReset} 
                    className="bg-[#D4AF37] hover:bg-brand-gold-light text-neutral-950 font-bold px-4 py-2 text-xs rounded-xl"
                  >
                    Send Reset Link
                  </Button>
                </div>

                {/* 2FA */}
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 bg-neutral-50/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-850 dark:text-neutral-200">
                    <Smartphone className="w-4.5 h-4.5 text-brand-gold" />
                    <span>Multi-Factor Authentication (MFA)</span>
                  </div>
                  <p className="text-[11px] text-neutral-440 leading-relaxed">
                    Require secondary authentication check codes during login configurations.
                  </p>
                  <p className="text-[10px] text-amber-500 font-semibold">
                    Note: To establish a Google Authenticator device key, contact compliance desk.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* NOTIFICATION PREFS PANEL */}
          {activeTab === 'notifications' && (
            <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">Notification Preferences</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Control which email dispatches and event logs you receive.</p>
              </div>

              <div className="space-y-4 max-w-xl">
                {[
                  { id: 'profit', title: 'Daily Yield Accruals', desc: 'Receive emails when yields credit to your contracts.' },
                  { id: 'referral', title: 'Referral Team Updates', desc: 'Alerts when team partners join or complete deposits.' },
                  { id: 'withdraw', title: 'Withdrawal Approvals', desc: 'Dispatches when withdrawal payments are processed.' },
                  { id: 'ai', title: 'AI Portfolio Alerts', desc: 'Accompanying alerts from automated market tracking logs.' },
                  { id: 'security', title: 'Account Security Alerts', desc: 'MFA updates, password resets, and whitelisting logs.' },
                  { id: 'marketing', title: 'Platform News & Features', desc: 'Optional platform news and quarterly announcements.' },
                ].map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-4 p-3 border border-neutral-100 dark:border-neutral-850 rounded-xl bg-neutral-50/20">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-neutral-850 dark:text-neutral-200">{item.title}</p>
                      <p className="text-[10px] text-neutral-400">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(prefs[item.id as keyof typeof prefs])}
                      onChange={(event) => setPrefs((prev) => ({ ...prev, [item.id]: event.target.checked }))}
                      className="mt-1 h-4 w-4 accent-[#D4AF37] cursor-pointer"
                    />
                  </div>
                ))}
                
                <Button 
                  type="button" 
                  disabled={saving} 
                  onClick={handlePreferenceSave} 
                  className="bg-[#D4AF37] hover:bg-brand-gold-light text-neutral-950 font-extrabold px-6 py-2.5 rounded-xl text-xs mt-2"
                >
                  {saving ? 'Saving preferences...' : 'Save Notification Preferences'}
                </Button>
              </div>
            </Card>
          )}

          {/* KYC PANELS */}
          {activeTab === 'kyc' && (
            <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-neutral-150 dark:border-neutral-850">
                <div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">Identity Verification (KYC)</h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Submit files to clear withdrawal checks. Auto-processing runs via Gemini AI OCR.
                  </p>
                </div>
                
                <Badge 
                  variant={
                    profile?.kycStatus === 'verified'
                      ? 'success'
                      : profile?.kycStatus === 'pending'
                      ? 'warning'
                      : 'gold'
                  }
                  text={profile?.kycStatus === 'verified' ? 'VERIFIED' : profile?.kycStatus === 'pending' ? 'PENDING AUDIT' : 'NOT STARTED'}
                  className="text-[9px] py-1 px-3 font-bold uppercase tracking-wider"
                />
              </div>

              {profile?.kycStatus === 'verified' ? (
                <div className="border border-emerald-500/25 bg-emerald-500/5 rounded-2xl p-5 max-w-xl space-y-4 shadow-inner">
                  <div className="flex items-center gap-3 border-b border-emerald-500/15 pb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-neutral-850 dark:text-neutral-200 font-bold text-xs">KYC Audit Passed</h3>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Account fully cleared for withdrawals</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs pt-1">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold block">Verified Document Details</span>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Legal Name</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-bold">{profile?.kycLegalName || '-'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Country of Residence</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-bold">{profile?.kycCountry || '-'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Document Type</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-bold uppercase">{profile?.kycDocumentType || '-'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Document Reference Number</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-mono font-bold">
                          {profile?.kycDocumentNumber ? `${profile.kycDocumentNumber.slice(0, 4)}****${profile.kycDocumentNumber.slice(-3)}` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : uploadingDoc || analyzingDoc ? (
                <div className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50/20 rounded-2xl p-8 max-w-xl flex flex-col items-center justify-center text-center gap-3 min-h-[220px]">
                  <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
                  <div>
                    <h3 className="text-xs font-bold text-neutral-850 dark:text-neutral-200">Processing Document Scan</h3>
                    <p className="text-[10px] text-neutral-400 max-w-xs leading-relaxed mt-1">
                      Gemini OCR is scanning front/back surfaces to extract passport, DOB, and expiry fields.
                    </p>
                  </div>
                </div>
              ) : !kycForm.legalName ? (
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-5 max-w-xl bg-neutral-50/10">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">ID Document Class</label>
                    <select
                      value={kycForm.documentType}
                      onChange={(event) => setKycForm((prev) => ({ 
                        ...prev, 
                        documentType: event.target.value,
                        backDocumentUrl: event.target.value === 'passport' ? '' : prev.backDocumentUrl
                      }))}
                      className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs focus:outline-none text-neutral-850 dark:text-neutral-200"
                    >
                      <option value="passport">International Passport (Info Page)</option>
                      <option value="national_id">National ID Card (Front + Back)</option>
                      <option value="driver_license">Driver's License (Front + Back)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Front upload */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                        {kycForm.documentType === 'passport' ? 'Passport Bio Page' : 'Front Surface'}
                      </label>
                      {kycForm.documentUrl ? (
                        <div className="relative rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden h-36 bg-neutral-950">
                          <img src={kycForm.documentUrl} alt="Front surface" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-neutral-950/80 opacity-0 hover:opacity-100 transition flex items-center justify-center gap-2">
                            <label className="cursor-pointer bg-brand-gold hover:bg-brand-gold-light text-neutral-950 px-3 py-1.5 rounded-lg text-[9px] font-bold">
                              Replace
                              <input type="file" accept="image/*" onChange={(e) => handleDocumentUpload('front', e)} className="hidden" />
                            </label>
                            <button
                              type="button"
                              onClick={() => setKycForm(prev => ({ ...prev, documentUrl: '' }))}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-neutral-200 dark:border-neutral-800 hover:border-brand-gold/40 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition relative bg-white dark:bg-neutral-950/30 h-36 group">
                          <input type="file" accept="image/*" onChange={(e) => handleDocumentUpload('front', e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <Upload className="w-5 h-5 text-neutral-400 group-hover:text-brand-gold mb-1.5 transition-colors" />
                          <p className="text-neutral-800 dark:text-neutral-200 text-xs font-bold">Upload Front Side</p>
                          <p className="text-[9px] text-neutral-400 mt-0.5">JPEG / PNG format</p>
                        </div>
                      )}
                    </div>

                    {/* Back upload (except passport) */}
                    {kycForm.documentType !== 'passport' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Back Surface</label>
                        {kycForm.backDocumentUrl ? (
                          <div className="relative rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden h-36 bg-neutral-950">
                            <img src={kycForm.backDocumentUrl} alt="Back surface" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-neutral-950/80 opacity-0 hover:opacity-100 transition flex items-center justify-center gap-2">
                              <label className="cursor-pointer bg-brand-gold hover:bg-brand-gold-light text-neutral-950 px-3 py-1.5 rounded-lg text-[9px] font-bold">
                                Replace
                                <input type="file" accept="image/*" onChange={(e) => handleDocumentUpload('back', e)} className="hidden" />
                              </label>
                              <button
                                type="button"
                                onClick={() => setKycForm(prev => ({ ...prev, backDocumentUrl: '' }))}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-dashed border-neutral-200 dark:border-neutral-800 hover:border-brand-gold/40 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition relative bg-white dark:bg-neutral-950/30 h-36 group">
                            <input type="file" accept="image/*" onChange={(e) => handleDocumentUpload('back', e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <Upload className="w-5 h-5 text-neutral-400 group-hover:text-brand-gold mb-1.5 transition-colors" />
                            <p className="text-neutral-800 dark:text-neutral-200 text-xs font-bold">Upload Back Side</p>
                            <p className="text-[9px] text-neutral-400 mt-0.5">JPEG / PNG format</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={handleRunAiAnalysis}
                      disabled={
                        !kycForm.documentUrl || 
                        (kycForm.documentType !== 'passport' && !kycForm.backDocumentUrl)
                      }
                      className="w-full bg-[#D4AF37] hover:bg-brand-gold-light text-neutral-950 font-extrabold h-11 text-xs"
                    >
                      Verify Document
                    </Button>
                  </div>
                </div>
              ) : (
                /* OCR Scan validation form */
                <form onSubmit={handleKycSubmit} className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-4 max-w-xl bg-neutral-50/10">
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Gemini Scan Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      kycForm.verified
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                      {kycForm.verified ? 'VERIFIED' : 'PENDING REVIEW'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] text-neutral-400 uppercase tracking-wider block font-bold">Legal Name</label>
                      <input
                        value={kycForm.legalName}
                        onChange={(event) => setKycForm((prev) => ({ ...prev, legalName: event.target.value }))}
                        className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2 text-xs focus:outline-none text-neutral-850 dark:text-neutral-200"
                        placeholder="Legal Name"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-neutral-400 uppercase tracking-wider block font-bold">Country</label>
                      <input
                        value={kycForm.country}
                        onChange={(event) => setKycForm((prev) => ({ ...prev, country: event.target.value }))}
                        className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2 text-xs focus:outline-none text-neutral-850 dark:text-neutral-200"
                        placeholder="Country"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] text-neutral-400 uppercase tracking-wider block font-bold">ID Number</label>
                      <input
                        value={kycForm.documentNumber}
                        onChange={(event) => setKycForm((prev) => ({ ...prev, documentNumber: event.target.value }))}
                        className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2 text-xs focus:outline-none text-neutral-850 dark:text-neutral-200"
                        placeholder="Document Number"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-neutral-400 uppercase tracking-wider block font-bold">Document Type</label>
                      <select
                        value={kycForm.documentType}
                        onChange={(event) => setKycForm((prev) => ({ ...prev, documentType: event.target.value }))}
                        className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2 text-xs focus:outline-none text-neutral-850 dark:text-neutral-200"
                      >
                        <option value="passport">Passport</option>
                        <option value="national_id">National ID</option>
                        <option value="driver_license">Driver's License</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] text-neutral-400 uppercase tracking-wider block font-bold">Date of Birth</label>
                      <input
                        type="date"
                        value={kycForm.dob}
                        onChange={(event) => setKycForm((prev) => ({ ...prev, dob: event.target.value }))}
                        className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2 text-xs focus:outline-none text-neutral-850 dark:text-neutral-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-neutral-400 uppercase tracking-wider block font-bold">Expiration Date</label>
                      <input
                        type="date"
                        value={kycForm.expiryDate}
                        onChange={(event) => setKycForm((prev) => ({ ...prev, expiryDate: event.target.value }))}
                        className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2 text-xs focus:outline-none text-neutral-850 dark:text-neutral-200"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="submit" 
                      disabled={saving} 
                      className="bg-[#D4AF37] hover:bg-brand-gold-light text-neutral-950 font-extrabold px-5 py-2 text-xs rounded-xl"
                    >
                      {saving ? 'Saving...' : kycForm.verified ? 'Complete Verification' : 'Submit KYC Details'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setKycForm({
                        legalName: '',
                        country: '',
                        documentType: 'passport',
                        documentNumber: '',
                        dob: '',
                        expiryDate: '',
                        documentUrl: '',
                        backDocumentUrl: '',
                        verified: false,
                        notes: ''
                      })}
                      className="bg-transparent text-red-500 hover:bg-red-500/5 px-4 py-2 text-xs font-bold rounded-xl border border-red-500/20"
                    >
                      Reset Upload
                    </button>
                  </div>
                </form>
              )}
            </Card>
          )}

          {/* WALLET WHITELISTS PANELS */}
          {activeTab === 'wallets' && (
            <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">Wallet Address Whitelist</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Whitelist external BEP20 wallet keys to clear withdrawal channels.</p>
              </div>

              {/* whitelist request form */}
              <form onSubmit={handleWalletSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3">
                <input 
                  value={walletForm.label} 
                  onChange={(event) => setWalletForm((prev) => ({ ...prev, label: event.target.value }))} 
                  className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs focus:outline-none text-neutral-850 dark:text-neutral-200 focus:border-brand-gold" 
                  placeholder="Wallet Label (e.g. Ledger, Metamask)" 
                  required
                />
                <input 
                  value={walletForm.address} 
                  onChange={(event) => setWalletForm((prev) => ({ ...prev, address: event.target.value }))} 
                  className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs focus:outline-none text-neutral-850 dark:text-neutral-200 focus:border-brand-gold font-mono" 
                  placeholder="USDT BEP20 Address (0x...)" 
                  required
                />
                <Button 
                  type="submit" 
                  disabled={saving} 
                  className="bg-[#D4AF37] hover:bg-brand-gold-light text-neutral-950 font-extrabold px-5 py-3 text-xs rounded-2xl"
                >
                  {saving ? 'Requesting...' : 'Request Whitelist'}
                </Button>
              </form>

              {/* wallets list */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold block">Whitelisted Wallets</span>
                {wallets.length === 0 ? (
                  <p className="text-xs text-neutral-400">No whitelisted wallets registered.</p>
                ) : (
                  wallets.map((wallet) => (
                    <div key={wallet.id} className="rounded-2xl border border-neutral-100 dark:border-neutral-850 p-4 bg-neutral-50/20 flex justify-between gap-4 items-center">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-neutral-850 dark:text-neutral-200">{wallet.label || 'BEP20 Address'}</p>
                        <p className="text-[11px] text-neutral-450 font-mono break-all leading-normal">{wallet.address}</p>
                      </div>
                      
                      <Badge 
                        variant={
                          wallet.status === 'approved'
                            ? 'success'
                            : wallet.status === 'rejected'
                            ? 'error'
                            : 'warning'
                        }
                        text={wallet.status.toUpperCase()}
                        className="text-[9px] font-bold py-0.5 px-2.5 rounded-full shrink-0"
                      />
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {/* DATA MANAGEMENT PANEL */}
          {activeTab === 'data' && (
            <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">Data & Privacy Management</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Export logs or manage account deletion cycles.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl pt-2">
                {/* Export Data */}
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 bg-neutral-50/20 space-y-3.5">
                  <div className="w-9 h-9 bg-brand-gold/10 rounded-xl flex items-center justify-center text-brand-gold">
                    <Download className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-neutral-800 dark:text-neutral-200 font-bold text-xs">Export Account Profile</h3>
                    <p className="text-[10px] text-neutral-400 leading-relaxed mt-1">
                      Download local transaction histories, wallet whitelists, kyc documents, and ledger reports as a standard JSON file.
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleExportData} 
                    className="bg-[#D4AF37] hover:bg-brand-gold-light text-neutral-950 font-bold px-4 py-2 text-xs rounded-xl"
                  >
                    Export JSON
                  </Button>
                </div>

                {/* Account Deletion */}
                <div className="border border-red-500/15 rounded-2xl p-5 bg-red-500/5 space-y-3.5">
                  <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                    <Trash className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-neutral-800 dark:text-neutral-200 font-bold text-xs text-red-500">Delete Account</h3>
                    <p className="text-[10px] text-neutral-400 leading-relaxed mt-1">
                      Initiate admin deletion reviews. Compliance KYC data and ledger records might remain preserved where locally required by law.
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleDeletionRequest} 
                    className="bg-transparent border border-red-500/25 hover:bg-red-500/10 text-red-500 font-bold px-4 py-2 text-xs rounded-xl transition-colors"
                  >
                    Request Deletion
                  </button>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
