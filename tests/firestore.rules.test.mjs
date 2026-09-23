import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";

const projectId = "spot-info-rules-test";
const rules = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");
const env = await initializeTestEnvironment({ projectId, firestore: { rules } });

const google = (uid, role) => env.authenticatedContext(uid, {
  email_verified: true,
  firebase: { sign_in_provider: "google.com" },
  ...(role ? { role } : {}),
});
const unverifiedGoogle = (uid) => env.authenticatedContext(uid, {
  email_verified: false,
  firebase: { sign_in_provider: "google.com" },
});
const otherProvider = (uid) => env.authenticatedContext(uid, {
  email_verified: true,
  firebase: { sign_in_provider: "github.com" },
});
const spotData = (name = "Test spot") => ({
  name,
  area: "Tokyo",
  category: "Park",
  note: "A small note",
  lat: 35.6812,
  lng: 139.7671,
  createdAt: serverTimestamp(),
});

async function createAs(context, uid, id, data = spotData()) {
  const database = context.firestore();
  const batch = writeBatch(database);
  batch.set(doc(database, "spots", id), data);
  batch.set(doc(database, "spotOwners", id), { uid });
  return batch.commit();
}

async function seedLegacy(id = "4") {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "spots", id), {
      name: "Legacy", area: "Tokyo", category: "Legacy", note: "Unassigned", lat: 35.7, lng: 139.7,
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
    await setDoc(doc(context.firestore(), "spotOwners", id), { uid: null, legacyOwnerId: 4, legacySource: "supabase" });
  });
}

test.afterEach(async () => { await env.clearFirestore(); });
test.after(async () => { await env.cleanup(); });

test("anonymous users can read public spots but cannot read ownership metadata or write", async () => {
  await seedLegacy();
  const anon = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(anon, "spots", "4")));
  await assertFails(getDoc(doc(anon, "spotOwners", "4")));
  await assertFails(createAs(env.unauthenticatedContext(), "", "anon"));
});

test("verified Google user atomically creates public spot and matching private uid mapping", async () => {
  const member = google("member-a");
  await assertSucceeds(createAs(member, "member-a", "new-a"));
  await assertSucceeds(getDoc(doc(member.firestore(), "spotOwners", "new-a")));
});

test("unverified email and non-Google identity cannot create spots", async () => {
  await assertFails(createAs(unverifiedGoogle("unverified"), "unverified", "unverified"));
  await assertFails(createAs(otherProvider("other-provider"), "other-provider", "other-provider"));
});

test("owner may edit allowed text fields and atomically delete own spot", async () => {
  const owner = google("owner-a");
  await assertSucceeds(createAs(owner, "owner-a", "owned"));
  await assertSucceeds(updateDoc(doc(owner.firestore(), "spots", "owned"), { note: "Updated note" }));
  await assertFails(updateDoc(doc(owner.firestore(), "spots", "owned"), { lat: 0 }));
  const batch = writeBatch(owner.firestore());
  batch.delete(doc(owner.firestore(), "spots", "owned"));
  batch.delete(doc(owner.firestore(), "spotOwners", "owned"));
  await assertSucceeds(batch.commit());
});

test("another verified Google user cannot edit or delete someone else's spot", async () => {
  const owner = google("owner-a");
  await assertSucceeds(createAs(owner, "owner-a", "owned"));
  const other = google("member-b").firestore();
  await assertFails(updateDoc(doc(other, "spots", "owned"), { note: "Hijack attempt" }));
  const batch = writeBatch(other);
  batch.delete(doc(other, "spots", "owned"));
  batch.delete(doc(other, "spotOwners", "owned"));
  await assertFails(batch.commit());
});

test("a user cannot claim an imported or otherwise existing legacy spot", async () => {
  await seedLegacy("4");
  const member = google("member-a").firestore();
  await assertFails(setDoc(doc(member, "spotOwners", "4"), { uid: "member-a" }));
  await assertFails(updateDoc(doc(member, "spotOwners", "4"), { uid: "member-a" }));
});

test("members query only their own private mapping while Google staff can read metadata", async () => {
  const member = google("member-a");
  await assertSucceeds(createAs(member, "member-a", "mine"));
  const ownQuery = query(collection(member.firestore(), "spotOwners"), where("uid", "==", "member-a"));
  await assertSucceeds(getDocs(ownQuery));
  await assertFails(getDocs(collection(member.firestore(), "spotOwners")));
  await assertSucceeds(getDocs(collection(google("admin-a", "admin").firestore(), "spotOwners")));
  await assertSucceeds(getDocs(collection(google("owner-a", "owner").firestore(), "spotOwners")));
});

test("client users cannot write role documents or elevate with a forged role claim field", async () => {
  const member = google("member-a").firestore();
  await assertFails(setDoc(doc(member, "roles", "member-a"), { role: "admin" }));
  await assertFails(setDoc(doc(member, "spotOwners", "forged"), { uid: "member-a", role: "admin" }));
});
