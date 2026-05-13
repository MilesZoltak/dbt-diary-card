import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  getMultiFactorResolver
} from 'firebase/auth';
import { auth } from '../config/firebase';
import FirestoreService from '../services/FirestoreService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mfaResolver, setMfaResolver] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await refreshProfile(currentUser.uid);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const refreshProfile = async (uid = user?.uid) => {
    if (!uid) return;
    try {
      const p = await FirestoreService.getUserProfile(uid);
      setProfile(p);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      if (error.code === 'auth/multi-factor-auth-required') {
        setMfaResolver(getMultiFactorResolver(auth, error));
        // The UI should handle showing the MFA input if mfaResolver is set
      } else {
        console.error('Login failed', error);
        throw error;
      }
    }
  };

  const logout = () => {
    setProfile(null);
    signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, mfaResolver, setMfaResolver, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
