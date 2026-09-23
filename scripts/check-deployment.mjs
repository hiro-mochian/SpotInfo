// Local configuration checks only. This script intentionally makes no cloud API calls.
const required = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) throw new Error(`Set Firebase public configuration: ${missing.join(", ")}.`);
if (process.env.VITE_FIREBASE_API_KEY?.includes("BEGIN PRIVATE KEY")) {
  throw new Error("Never use a service-account private key in VITE_FIREBASE_API_KEY.");
}
if (process.env.VITE_BASE_PATH && process.env.VITE_BASE_PATH !== "/") {
  throw new Error("Firebase Hosting deployment must use VITE_BASE_PATH=/.");
}
console.log("PASS: Firebase public configuration is present. Verify Google provider, authorized domains, custom claims, rules, indexes, and a real browser sign-in before publication.");
