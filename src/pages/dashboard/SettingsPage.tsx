import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { User, Shield, Bell, FileCheck, AlertTriangle, LogOut, WalletCards, Database, MailCheck, Trash2, Download } from 'lucide-react';
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

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [prefs, setPrefs] = useState({ profit: true, referral: true, withdraw: true, ai: false, security: true, marketing: false });
  const [kycForm, setKycForm] = useState({ legalName: '', country: '', documentType: 'passport' });
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

  const handleKycSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!kycForm.legalName.trim() || !kycForm.country.trim()) return toast.error('Complete legal name and country.');
    setSaving(true);
    try {
      await submitKycRequest(user.uid, kycForm.legalName.trim(), kycForm.country.trim(), kycForm.documentType);
      toast.success('KYC review request submitted');
      setKycForm({ legalName: '', country: '', documentType: 'passport' });
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
                  <h2 className="text-xl font-medium text-white mb-2">KYC Readiness</h2>
                  <p className="text-sm text-text-secondary max-w-md">Submit KYC metadata for admin review. Identity documents should be collected only through a private KYC provider or secure storage workflow.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider bg-gold-500/10 text-gold-500 border border-gold-500/20">
                  <AlertTriangle className="w-4 h-4" /> {profile?.kycStatus || 'not_started'}
                </span>
              </div>
              <form onSubmit={handleKycSubmit} className="bg-dark-900/50 border border-gold-500/10 rounded-xl p-6 space-y-4 max-w-xl">
                <input value={kycForm.legalName} onChange={(event) => setKycForm((prev) => ({ ...prev, legalName: event.target.value }))} className="input-gold text-sm" placeholder="Legal full name" />
                <input value={kycForm.country} onChange={(event) => setKycForm((prev) => ({ ...prev, country: event.target.value }))} className="input-gold text-sm" placeholder="Country of residence" />
                <select value={kycForm.documentType} onChange={(event) => setKycForm((prev) => ({ ...prev, documentType: event.target.value }))} className="input-gold text-sm">
                  <option value="passport">Passport</option>
                  <option value="national_id">National ID</option>
                  <option value="driver_license">Driver license</option>
                </select>
                <GoldButton type="submit" disabled={saving} className="h-10 px-6">{saving ? 'Submitting...' : 'Submit for Review'}</GoldButton>
                <p className="text-xs text-text-muted leading-relaxed">Do not upload document images here. This request only records review metadata and status.</p>
              </form>
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
