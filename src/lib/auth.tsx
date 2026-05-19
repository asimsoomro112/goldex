import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  reload,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from './firebase';

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  referral?: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
  deleteCurrentAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(email, password) {
      ensureFirebase();
      await signInWithEmailAndPassword(auth!, email, password);
    },
    async register(input) {
      ensureFirebase();
      const credential = await createUserWithEmailAndPassword(auth!, input.email, input.password);
      await updateProfile(credential.user, { displayName: input.name });
      await ensureUserDocument(credential.user, input.name, input.referral);
      await sendEmailVerification(credential.user);
      return credential.user;
    },
    async loginWithGoogle() {
      ensureFirebase();
      try {
        const credential = await signInWithPopup(auth!, googleProvider);
        await ensureUserDocument(credential.user, credential.user.displayName || 'Account');
        return credential.user;
      } catch (error: any) {
        console.error('Google Auth Error:', error);
        if (error.code === 'auth/unauthorized-domain') {
          throw new Error(`This domain (${window.location.hostname}) is not authorized in your Firebase Project. Please go to Firebase Console -> Authentication -> Settings -> Authorized Domains and add "${window.location.hostname}".`);
        }
        if (error.code === 'auth/operation-not-allowed') {
          throw new Error('Google Sign-In provider is disabled in your Firebase project. Please enable it in Firebase Console -> Authentication -> Sign-in method.');
        }
        if (error.code === 'auth/popup-blocked') {
          throw new Error('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
        }
        throw error;
      }
    },
    async logout() {
      ensureFirebase();
      await signOut(auth!);
    },
    async resetPassword(email) {
      ensureFirebase();
      await sendPasswordResetEmail(auth!, email);
    },
    async sendVerificationEmail() {
      ensureFirebase();
      if (!auth!.currentUser) throw new Error('You must be signed in to verify email.');
      await sendEmailVerification(auth!.currentUser);
    },
    async refreshUser() {
      ensureFirebase();
      if (!auth!.currentUser) return;
      await reload(auth!.currentUser);
      setUser({ ...auth!.currentUser });
    },
    async deleteCurrentAccount() {
      ensureFirebase();
      if (!auth!.currentUser) throw new Error('You must be signed in to delete your account.');
      await deleteUser(auth!.currentUser);
      setUser(null);
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

async function ensureUserDocument(user: User, name: string, referral?: string) {
  if (!db) return;

  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) return;

  await setDoc(userRef, {
    uid: user.uid,
    displayName: name,
    email: user.email,
    photoURL: user.photoURL || null,
    referralCode: createReferralCode(user.uid),
    referredBy: referral?.trim().toUpperCase() || null,
    role: 'user',
    kycStatus: 'not_started',
    accountStatus: 'active',
    emailVerifiedAt: null,
    totals: {
      lockedPrincipal: 0,
      todayProfit: 0,
      totalEarned: 0,
      withdrawableProfit: 0,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

function createReferralCode(uid: string) {
  return `GX${uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`;
}

function ensureFirebase() {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase is not configured. Add VITE_FIREBASE_* values to your .env file.');
  }
}
