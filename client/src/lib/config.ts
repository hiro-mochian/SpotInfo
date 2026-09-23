const required = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() ?? "",
};

export const firebaseConfig = {
  ...required,
  ...(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim()
    ? { messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID.trim() }
    : {}),
};

export const isFirebaseConfigured = Object.values(required).every(Boolean);

export function configurationMessage(): string {
  if (!isFirebaseConfigured) {
    return "Firebase の公開設定が未完了です。VITE_FIREBASE_API_KEY、VITE_FIREBASE_AUTH_DOMAIN、VITE_FIREBASE_PROJECT_ID、VITE_FIREBASE_APP_ID を設定してください。";
  }
  return "";
}

export const appBaseUrl = import.meta.env.BASE_URL;
