import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig, isFirebaseConfigured } from "./config";

const app = isFirebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

googleProvider.addScope("email");
googleProvider.addScope("profile");

export function requireAuth() {
  if (!auth) throw new Error("Firebase の公開設定が未完了です。");
  return auth;
}

export function requireDb() {
  if (!db) throw new Error("Firebase の公開設定が未完了です。");
  return db;
}
