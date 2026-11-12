import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely (singleton)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google Auth Provider configured with Google Drive scopes
export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive',
];

const provider = new GoogleAuthProvider();
GOOGLE_DRIVE_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to track ongoing sign in flow
let isSigningIn = false;

// In-memory token cache (strictly not stored in localStorage / sessionStorage)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: User | null = null;

// Callbacks for subscribers
type AuthListener = (user: User | null, token: string | null) => void;
const listeners: Set<AuthListener> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener(cachedGoogleUser, cachedAccessToken);
    } catch (err) {
      console.warn('Google auth listener error:', err);
    }
  });
}

/**
 * Initialize Google Auth state listener.
 */
export function initGoogleAuth(
  onSuccess?: (user: User, token: string) => void,
  onFailure?: () => void
): () => void {
  const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
    cachedGoogleUser = user;
    if (user) {
      if (cachedAccessToken) {
        notifyListeners();
        if (onSuccess) onSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Attempt silent re-auth or wait for interaction
        notifyListeners();
        if (onFailure) onFailure();
      }
    } else {
      cachedAccessToken = null;
      notifyListeners();
      if (onFailure) onFailure();
    }
  });

  return unsubscribe;
}

/**
 * Subscribe to Google auth state changes
 */
export function subscribeGoogleAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  // Initial immediate call with current in-memory state
  listener(cachedGoogleUser, cachedAccessToken);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Sign in with Google using popup to obtain Google Drive OAuth access token
 */
export async function signInWithGoogle(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Gagal memperoleh access token Google Drive dari autentikasi.');
    }

    cachedAccessToken = credential.accessToken;
    cachedGoogleUser = result.user;
    notifyListeners();

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Get current in-memory cached access token
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  return cachedAccessToken;
}

/**
 * Get current connected Google user
 */
export function getConnectedGoogleUser(): User | null {
  return cachedGoogleUser;
}

/**
 * Check if Google Drive is currently authenticated with a valid token
 */
export function isGoogleDriveConnected(): boolean {
  return Boolean(cachedAccessToken && cachedGoogleUser);
}

/**
 * Disconnect / Sign out from Google Drive
 */
export async function signOutGoogle(): Promise<void> {
  try {
    await signOut(auth);
  } finally {
    cachedAccessToken = null;
    cachedGoogleUser = null;
    notifyListeners();
  }
}
