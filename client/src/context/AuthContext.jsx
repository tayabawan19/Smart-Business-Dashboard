import React, { createContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase/firebase';
import { useAuth } from './useAuth';

export const AuthContext = createContext(null);
export { useAuth };

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Monitor Firebase auth state if Firebase is initialized
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Check for persisted demo user in session/localStorage
      const savedDemoUser = localStorage.getItem('demo_user');
      if (savedDemoUser) {
        try {
          setCurrentUser(JSON.parse(savedDemoUser));
        } catch (e) {
          localStorage.removeItem('demo_user');
        }
      }
      setLoading(false);
    }
  }, []);

  /**
   * Sign up with email and password
   */
  const signup = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      const mockUser = {
        uid: 'demo-' + Date.now(),
        email: email,
        displayName: email.split('@')[0],
        isDemo: true,
      };
      setCurrentUser(mockUser);
      localStorage.setItem('demo_user', JSON.stringify(mockUser));
      return { user: mockUser };
    }
    return createUserWithEmailAndPassword(auth, email, password);
  };

  /**
   * Log in with email and password
   */
  const login = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      const mockUser = {
        uid: 'demo-' + Date.now(),
        email: email,
        displayName: email.split('@')[0],
        isDemo: true,
      };
      setCurrentUser(mockUser);
      localStorage.setItem('demo_user', JSON.stringify(mockUser));
      return { user: mockUser };
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  /**
   * Sign in with Google Popup
   */
  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      const mockUser = {
        uid: 'demo-google-' + Date.now(),
        email: 'alex.founder@company.com',
        displayName: 'Alex Founder',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        isDemo: true,
      };
      setCurrentUser(mockUser);
      localStorage.setItem('demo_user', JSON.stringify(mockUser));
      return { user: mockUser };
    }
    return signInWithPopup(auth, googleProvider);
  };

  /**
   * Log out user
   */
  const logout = async () => {
    localStorage.removeItem('demo_user');
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    isFirebaseConfigured,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
