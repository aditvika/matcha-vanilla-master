import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDRTuY9KleXRBiD_WYrIxkzhdleNKxmHgA",
  authDomain: "mvmaster-74874.firebaseapp.com",
  projectId: "mvmaster-74874",
  storageBucket: "mvmaster-74874.firebasestorage.app",
  messagingSenderId: "269754624402",
  appId: "1:269754624402:web:2f947b383ec57d58f2394b",
  measurementId: "G-JTLM0J3SX1",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const EMAIL_LINK_STORAGE_KEY = "mv:auth:emailForSignIn";

export async function sendMagicLink(email: string) {
  const actionCodeSettings = {
    url: "https://id-preview--794be7d5-4f92-4ab6-8751-1e17f99cf4c2.lovable.app/settings?emailLink=1",
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, email);
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function completeEmailLinkSignInIfPresent() {
  if (typeof window === "undefined") return null;
  if (!isSignInWithEmailLink(auth, window.location.href)) return null;
  let email = window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY);
  if (!email) {
    email = window.prompt("Please confirm your email to finish signing in") || "";
  }
  if (!email) return null;
  const result = await signInWithEmailLink(auth, email, window.location.href);
  window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
  return result.user;
}
