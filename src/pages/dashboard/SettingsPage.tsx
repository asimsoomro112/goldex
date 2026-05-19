import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { User, Shield, Bell, FileCheck, AlertTriangle, LogOut, WalletCards, Database, MailCheck, Trash2, Download, Upload, Loader2, CheckCircle2, XCircle } from 'lucide-react';
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
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'kyc', label: 'KYC Status', icon: FileCheck },
    { id: 'wallets', label: 'Wallets', icon: WalletCards },
    { id: 'data', label: 'Data', icon: Database },
  ];

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { displayName: displayName.trim(), phone: phone.trim() || null });
      toast.success('Profile updated');
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
      await sendEmail('password_reset', { to: user.email, name: profile?.displayName || user.displayName || user.email });
      toast.success('Password reset email sent');
    } catch (error: any) {
      toast.error(error.message || 'Could not send reset email');
    }
  };

  const handleEmailVerification = async () => {
    try {
      await sendVerificationEmail();
      toast.success('Verification email sent');
    } catch (error: any) {
      toast.error(error.message || 'Could not send verification email');
    }
  };

  const handleRefreshUser = async () => {
    await refreshUser();
    toast.success('Account status refreshed');
  };

  const handleDocumentUpload = async (side: 'front' | 'back', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingDoc(true);
    try {
      let resultUrl = '';
      try {
        // Attempt Cloudinary upload first
        const upload = await uploadToCloudinary(file, `goldex/kyc/${user.uid}`);
        resultUrl = upload.secure_url;
        toast.success(`${side === 'front' ? 'Front' : 'Back'} side uploaded to Cloudinary.`);
      } catch (cloudinaryErr: any) {
        console.warn('Cloudinary upload failed, using secure base64 compression fallback:', cloudinaryErr);
        // Fall back to client-side compressed base64 string
        const base64 = await compressImageToBase64(file);
        resultUrl = base64;
        toast.success(`${side === 'front' ? 'Front' : 'Back'} side processed (offline fallback).`);
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
        toast.error('AI was unable to verify automatically. Please correct details manually.');
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
    if (!kycForm.documentUrl) return toast.error('Please upload the front side of your document first.');
    if (kycForm.documentType !== 'passport' && !kycForm.backDocumentUrl) return toast.error('Please upload the back side of your document first.');
    if (!kycForm.legalName.trim() || !kycForm.country.trim()) return toast.error('Complete legal name and country.');
    
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
      toast.success(kycForm.verified ? 'KYC Auto-Verified & Activated!' : 'KYC submitted for compliance review');
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
      toast.success('Wallet whitelist request submitted');
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
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-medium text-white">Account Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 lg:col-span-3">
          <GlassCard className="p-2 flex flex-row md:flex-col gap-1 overflow-x-auto hide-scrollbar sticky top-28">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium whitespace-nowrap ${activeTab === item.id ? 'bg-gold-500/10 text-gold-500' : 'text-text-secondary hover:text-white hover:bg-dark-800'}`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </button>
            ))}
            <div className="h-px w-full bg-gold-500/10 my-2 hidden md:block" />
            <button onClick={logout} className="hidden md:flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium text-text-secondary hover:text-danger hover:bg-dark-800">
              <LogOut className="w-5 h-5 shrink-0" />
              Sign Out
            </button>
          </GlassCard>
        </div>

        <div className="md:col-span-8 lg:col-span-9">
          {activeTab === 'profile' && (
            <GlassCard className="p-8">
              <h2 className="text-xl font-medium text-white mb-6">Personal Information</h2>
              <form onSubmit={handleProfileSave} className="space-y-6 max-w-xl">
                <div className="flex items-center gap-6 pb-6 border-b border-gold-500/10">
                  <div className="w-20 h-20 rounded-full bg-dark-800 border-2 border-gold-500/30 flex items-center justify-center overflow-hidden">
                    {profile?.photoURL ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl font-display text-gold-500">{(displayName || '-').charAt(0).toUpperCase()}</span>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white mb-1">Profile Photo</p>
                    <p className="text-xs text-text-muted mb-3">Upload a JPG or PNG avatar.</p>
                    <label className="inline-flex">
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="sr-only" />
                      <span className="btn-ghost h-8 px-4 text-xs rounded-xl inline-flex items-center justify-center">
                        {uploading ? 'Uploading...' : 'Upload Photo'}
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Full Name</label>
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="input-gold text-sm" required />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Email Address</label>
                  <input type="email" value={profile?.email || user?.email || ''} disabled className="input-gold text-sm opacity-70 cursor-not-allowed" />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Phone Number</label>
                  <input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" className="input-gold text-sm" placeholder="+1..." />
                </div>

                <GoldButton type="submit" disabled={saving} className="h-10 px-6">{saving ? 'Saving...' : 'Save Changes'}</GoldButton>
              </form>
            </GlassCard>
          )}

          {activeTab === 'security' && (
            <GlassCard className="p-8">
              <h2 className="text-xl font-medium text-white mb-6">Security</h2>
              <div className="max-w-xl space-y-6">
                <div className="rounded-xl border border-gold-500/10 bg-dark-900/50 p-5">
                  <h3 className="text-white font-medium mb-2 flex items-center gap-2"><MailCheck className="w-4 h-4 text-gold-500" /> Email Verification</h3>
                  <p className="text-sm text-text-secondary leading-7 mb-4">
                    Status: <span className={user?.emailVerified ? 'text-profit-green' : 'text-gold-500'}>{user?.emailVerified ? 'Verified' : 'Not verified'}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!user?.emailVerified && <GoldButton type="button" onClick={handleEmailVerification} className="h-10 px-6">Send Verification</GoldButton>}
                    <button type="button" onClick={handleRefreshUser} className="btn-ghost h-10 px-4 rounded-xl text-sm">Refresh Status</button>
                  </div>
                </div>

                <div className="rounded-xl border border-gold-500/10 bg-dark-900/50 p-5">
                  <h3 className="text-white font-medium mb-2">Password Reset</h3>
                  <p className="text-sm text-text-secondary leading-7 mb-4">We will send a secure reset link to your registered email address. Use this link to safely update your password and keep your account protected.</p>
                  <GoldButton type="button" onClick={handlePasswordReset} className="h-10 px-6">Send Reset Email</GoldButton>
                </div>

                <div className="rounded-xl border border-gold-500/10 bg-dark-900/50 p-5">
                  <h3 className="text-white font-medium mb-2">Multi-Factor Authentication (MFA)</h3>
                  <p className="text-sm text-text-secondary leading-7">Enhance your account security by enabling Multi-Factor Authentication. Once configured, you will be required to provide a verification code during login.</p>
                  <p className="text-xs text-text-muted mt-3">To configure an authenticator app (such as Google Authenticator), please contact our security support desk.</p>
                </div>
              </div>
            </GlassCard>
          )}

          {activeTab === 'notifications' && (
            <GlassCard className="p-8">
              <h2 className="text-xl font-medium text-white mb-6">Notification Preferences</h2>
              <div className="space-y-6 max-w-xl">
                {[
                  { id: 'profit', title: 'Profit Updates', desc: 'Receive email when admin credits profit.' },
                  { id: 'referral', title: 'Referral Updates', desc: 'Receive email when referral features are enabled.' },
                  { id: 'withdraw', title: 'Withdrawal Status', desc: 'Receive email for withdrawal paid or rejected status.' },
                  { id: 'ai', title: 'AI Alerts', desc: 'Optional AI market updates when enabled.' },
                  { id: 'security', title: 'Security Alerts', desc: 'Receive account and wallet security notifications.' },
                  { id: 'marketing', title: 'Product News', desc: 'Optional platform announcements and policy updates.' },
                ].map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-sm font-medium text-white mb-1">{item.title}</p>
                      <p className="text-xs text-text-muted">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(prefs[item.id as keyof typeof prefs])}
                      onChange={(event) => setPrefs((prev) => ({ ...prev, [item.id]: event.target.checked }))}
                      className="mt-1 h-5 w-5 accent-[#D4AF37]"
                    />
                  </div>
                ))}
                <GoldButton type="button" disabled={saving} onClick={handlePreferenceSave} className="h-10 px-6">{saving ? 'Saving...' : 'Save Preferences'}</GoldButton>
              </div>
            </GlassCard>
          )}

          {activeTab === 'kyc' && (
            <GlassCard className="p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.18] pointer-events-none">
                <img src="/images/shield Security.png" alt="KYC Shield" className="w-36 h-36 object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.25)]" />
              </div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-medium text-white mb-2">Identity Verification (KYC)</h2>
                  <p className="text-sm text-text-secondary max-w-md">
                    Upload your document to verify your identity. Your details are securely encrypted and processed.
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider ${
                  profile?.kycStatus === 'verified'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : profile?.kycStatus === 'pending'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'bg-gold-500/10 text-gold-500 border border-gold-500/20'
                }`}>
                  <FileCheck className="w-4 h-4" /> {profile?.kycStatus === 'verified' ? 'Verified' : profile?.kycStatus === 'pending' ? 'Pending' : 'Not Started'}
                </span>
              </div>

              {profile?.kycStatus === 'verified' ? (
                <div className="bg-emerald-950/10 border border-emerald-500/25 rounded-2xl p-6 max-w-xl space-y-6">
                  <div className="flex items-center gap-4 border-b border-emerald-500/20 pb-4">
                    <div className="p-3 bg-emerald-500/10 rounded-full">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                        Verification Complete
                      </h3>
                      <p className="text-emerald-400 text-xs font-medium">Your identity has been verified successfully.</p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <h4 className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Verified Details</h4>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs">
                      <div>
                        <span className="text-text-muted block mb-0.5">Legal Name</span>
                        <span className="text-white font-medium">{profile?.kycLegalName || '-'}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block mb-0.5">Country / Region</span>
                        <span className="text-white font-medium">{profile?.kycCountry || '-'}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block mb-0.5">Document Type</span>
                        <span className="text-white font-medium uppercase">
                          {profile?.kycDocumentType === 'passport' 
                            ? 'Passport' 
                            : profile?.kycDocumentType === 'driver_license' 
                            ? "Driver's License" 
                            : profile?.kycDocumentType === 'national_id' 
                            ? 'National ID' 
                            : profile?.kycDocumentType || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block mb-0.5">Document Number</span>
                        <span className="text-white font-medium font-mono">
                          {profile?.kycDocumentNumber 
                            ? `${profile.kycDocumentNumber.slice(0, 4)}****${profile.kycDocumentNumber.slice(-4)}`
                            : '-'}
                        </span>
                      </div>
                      {profile?.kycDob && (
                        <div>
                          <span className="text-text-muted block mb-0.5">Date of Birth</span>
                          <span className="text-white font-medium">{profile.kycDob}</span>
                        </div>
                      )}
                      {profile?.kycExpiryDate && (
                        <div>
                          <span className="text-text-muted block mb-0.5">Expiration Date</span>
                          <span className="text-white font-medium">{profile.kycExpiryDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : uploadingDoc || analyzingDoc ? (
                <div className="bg-dark-900/50 border border-gold-500/10 rounded-2xl p-8 max-w-xl flex flex-col items-center justify-center text-center gap-4 min-h-[280px]">
                  <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
                  <div>
                    <h3 className="text-white font-medium text-base mb-1">
                      System is verifying...
                    </h3>
                    <p className="text-text-muted text-xs max-w-xs leading-relaxed">
                      Please wait while our system securely processes and validates your identity document.
                    </p>
                  </div>
                </div>
              ) : !kycForm.legalName ? (
                <div className="bg-dark-900/50 border border-gold-500/10 rounded-2xl p-6 space-y-6 max-w-xl">
                  <div>
                    <label className="text-xs text-text-muted uppercase tracking-wider block font-medium mb-2">Select ID Document Type</label>
                    <select
                      value={kycForm.documentType}
                      onChange={(event) => setKycForm((prev) => ({ 
                        ...prev, 
                        documentType: event.target.value,
                        // Reset back doc if switching to passport
                        backDocumentUrl: event.target.value === 'passport' ? '' : prev.backDocumentUrl
                      }))}
                      className="input-gold text-sm w-full"
                    >
                      <option value="passport">Passport (Info Page only)</option>
                      <option value="national_id">National ID Card (Front + Back)</option>
                      <option value="driver_license">Driver's License (Front + Back)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Front Document Upload Slot */}
                    <div>
                      <label className="text-xs text-text-muted block font-medium mb-2">
                        {kycForm.documentType === 'passport' ? 'Passport Info Page' : 'ID Card Front Side'}
                      </label>
                      {kycForm.documentUrl ? (
                        <div className="relative rounded-xl border border-gold-500/20 overflow-hidden h-36 group bg-dark-950/40">
                          <img src={kycForm.documentUrl} alt="Document Front" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <label className="cursor-pointer bg-gold-500 hover:bg-gold-600 text-dark-950 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition">
                              Change
                              <input type="file" accept="image/*" onChange={(e) => handleDocumentUpload('front', e)} className="hidden" />
                            </label>
                            <button
                              type="button"
                              onClick={() => setKycForm(prev => ({ ...prev, documentUrl: '' }))}
                              className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-gold-500/20 hover:border-gold-500/40 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition relative group bg-dark-900/20 h-36">
                          <input type="file" accept="image/*" onChange={(e) => handleDocumentUpload('front', e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <Upload className="w-6 h-6 text-gold-500/50 group-hover:text-gold-500 transition mb-2" />
                          <p className="text-white text-xs font-medium mb-0.5">Upload Front Side</p>
                          <p className="text-[9px] text-text-muted text-center leading-relaxed">JPG or PNG</p>
                        </div>
                      )}
                    </div>

                    {/* Back Document Upload Slot (Hidden for passport) */}
                    {kycForm.documentType !== 'passport' && (
                      <div>
                        <label className="text-xs text-text-muted block font-medium mb-2">ID Card Back Side</label>
                        {kycForm.backDocumentUrl ? (
                          <div className="relative rounded-xl border border-gold-500/20 overflow-hidden h-36 group bg-dark-950/40">
                            <img src={kycForm.backDocumentUrl} alt="Document Back" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <label className="cursor-pointer bg-gold-500 hover:bg-gold-600 text-dark-950 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition">
                                Change
                                <input type="file" accept="image/*" onChange={(e) => handleDocumentUpload('back', e)} className="hidden" />
                              </label>
                              <button
                                type="button"
                                onClick={() => setKycForm(prev => ({ ...prev, backDocumentUrl: '' }))}
                                className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-dashed border-gold-500/20 hover:border-gold-500/40 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition relative group bg-dark-900/20 h-36">
                            <input type="file" accept="image/*" onChange={(e) => handleDocumentUpload('back', e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <Upload className="w-6 h-6 text-gold-500/50 group-hover:text-gold-500 transition mb-2" />
                            <p className="text-white text-xs font-medium mb-0.5">Upload Back Side</p>
                            <p className="text-[9px] text-text-muted text-center leading-relaxed">JPG or PNG</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <GoldButton
                      type="button"
                      onClick={handleRunAiAnalysis}
                      disabled={
                        !kycForm.documentUrl || 
                        (kycForm.documentType !== 'passport' && !kycForm.backDocumentUrl)
                      }
                      className="w-full h-11"
                    >
                      Verify Document
                    </GoldButton>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleKycSubmit} className="bg-dark-900/50 border border-gold-500/10 rounded-2xl p-6 space-y-4 max-w-xl">
                  <div className="p-3 bg-gold-500/5 border border-gold-500/10 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Verification Scan Result:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      kycForm.verified
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {kycForm.verified ? 'System Verified' : 'Under Review'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-wider block font-medium mb-1.5">Legal Name</label>
                      <input
                        value={kycForm.legalName}
                        onChange={(event) => setKycForm((prev) => ({ ...prev, legalName: event.target.value }))}
                        className="input-gold text-sm w-full"
                        placeholder="Legal full name"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-wider block font-medium mb-1.5">Country of residence</label>
                      <input
                        value={kycForm.country}
                        onChange={(event) => setKycForm((prev) => ({ ...prev, country: event.target.value }))}
                        className="input-gold text-sm w-full"
                        placeholder="Country"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-wider block font-medium mb-1.5">Document Number</label>
                      <input
                        value={kycForm.documentNumber}
                        onChange={(event) => setKycForm((prev) => ({ ...prev, documentNumber: event.target.value }))}
                        className="input-gold text-sm w-full"
                        placeholder="ID / Passport Number"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-wider block font-medium mb-1.5">Document Type</label>
                      <select
                        value={kycForm.documentType}
                        onChange={(event) => setKycForm((prev) => ({ ...prev, documentType: event.target.value }))}
                        className="input-gold text-sm w-full"
                      >
                        <option value="passport">Passport</option>
                        <option value="national_id">National ID</option>
                        <option value="driver_license">Driver's License</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-wider block font-medium mb-1.5">Date of Birth</label>
                      <input
                        type="date"
                        value={kycForm.dob}
                        onChange={(event) => setKycForm((prev) => ({ ...prev, dob: event.target.value }))}
                        className="input-gold text-sm w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-wider block font-medium mb-1.5">Expiration Date</label>
                      <input
                        type="date"
                        value={kycForm.expiryDate}
                        onChange={(event) => setKycForm((prev) => ({ ...prev, expiryDate: event.target.value }))}
                        className="input-gold text-sm w-full"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <GoldButton type="submit" disabled={saving} className="h-10 px-6">
                      {saving ? 'Saving...' : kycForm.verified ? 'Complete Verification' : 'Submit for Review'}
                    </GoldButton>
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
                      className="h-10 px-5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition"
                    >
                      Reset Upload
                    </button>
                  </div>
                </form>
              )}
            </GlassCard>
          )}

          {activeTab === 'wallets' && (
            <GlassCard className="p-8">
              <h2 className="text-xl font-medium text-white mb-6">Wallet Whitelist</h2>
              <form onSubmit={handleWalletSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_auto] gap-3 mb-6">
                <input value={walletForm.label} onChange={(event) => setWalletForm((prev) => ({ ...prev, label: event.target.value }))} className="input-gold text-sm" placeholder="Wallet label" />
                <input value={walletForm.address} onChange={(event) => setWalletForm((prev) => ({ ...prev, address: event.target.value }))} className="input-gold text-sm font-mono" placeholder="0x..." />
                <GoldButton type="submit" disabled={saving} className="h-11 px-5">{saving ? 'Saving...' : 'Request'}</GoldButton>
              </form>
              <div className="space-y-3">
                {wallets.length === 0 ? <p className="text-sm text-text-muted">No wallet whitelist requests yet.</p> : wallets.map((wallet) => (
                  <div key={wallet.id} className="rounded-xl border border-gold-500/10 bg-dark-900/50 p-4">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="text-sm text-white">{wallet.label || 'BEP20 wallet'}</p>
                        <p className="text-xs text-text-muted font-mono break-all">{wallet.address}</p>
                      </div>
                      <span className="badge badge-gold h-fit">{wallet.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {activeTab === 'data' && (
            <GlassCard className="p-8">
              <h2 className="text-xl font-medium text-white mb-6">Account Data</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-3xl">
                <div className="rounded-xl border border-gold-500/10 bg-dark-900/50 p-5">
                  <Download className="w-5 h-5 text-gold-500 mb-3" />
                  <h3 className="text-white font-medium mb-2">Export Account Data</h3>
                  <p className="text-sm text-text-secondary leading-7 mb-4">Download profile, deposits, investments, withdrawals, wallet requests, and immutable ledger entries as JSON.</p>
                  <GoldButton type="button" onClick={handleExportData} className="h-10 px-6">Export JSON</GoldButton>
                </div>
                <div className="rounded-xl border border-danger/20 bg-danger/5 p-5">
                  <Trash2 className="w-5 h-5 text-danger mb-3" />
                  <h3 className="text-white font-medium mb-2">Account Deletion</h3>
                  <p className="text-sm text-text-secondary leading-7 mb-4">Request admin review for deletion. Ledger and compliance records may be retained where legally required.</p>
                  <button type="button" onClick={handleDeletionRequest} className="btn-ghost h-10 px-4 rounded-xl text-sm text-danger">Request Deletion</button>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
