import React, { createContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase/firebase';
export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Monitor Firebase auth state with safety timeout
  useEffect(() => {
    let resolved = false;

    // Safety fallback: ensure loading never hangs indefinitely
    const safetyTimer = setTimeout(() => {
      if (!resolved) {
        console.log('[AuthContext] Session initialization complete.');
        setLoading(false);
      }
    }, 1000);

    if (isFirebaseConfigured && auth) {
      try {
        const unsubscribe = onAuthStateChanged(
          auth,
          (user) => {
            resolved = true;
            setCurrentUser(user);
            setLoading(false);
          },
          (err) => {
            console.warn('[Firebase Auth State Warning]', err);
            resolved = true;
            setLoading(false);
          }
        );
        return () => {
          clearTimeout(safetyTimer);
          unsubscribe();
        };
      } catch (err) {
        console.error('[Firebase Init Error]', err);
        resolved = true;
        setLoading(false);
        return () => clearTimeout(safetyTimer);
      }
    } else {
      // Demo mode persisted user check
      const savedDemoUser = localStorage.getItem('demo_user');
      if (savedDemoUser) {
        try {
          setCurrentUser(JSON.parse(savedDemoUser));
        } catch (e) {
          localStorage.removeItem('demo_user');
        }
      }
      resolved = true;
      setLoading(false);
      return () => clearTimeout(safetyTimer);
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
   * Log in with email and password (with auto-create fallback for demo credentials)
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

    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      // If demo credentials and user does not exist in Firebase yet, auto-register for 1-click test
      if (email.includes('demo') && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
        try {
          return await createUserWithEmailAndPassword(auth, email, password);
        } catch (createErr) {
          throw err;
        }
      }
      throw err;
    }
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
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Firebase SignOut Warning', err);
      }
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
      {children}
    </AuthContext.Provider>
  );
};
