import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import { setDoc, doc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';

let testEnv;

beforeAll(async () => {
  // Initialize the test environment using the local firestore.rules file
  testEnv = await initializeTestEnvironment({
    projectId: 'fractal-rosette-test',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Firestore Security Rules', () => {
  describe('1. Owner Access', () => {
    it('should allow a user to read and write their own profile', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const docRef = doc(alice.firestore(), 'users/alice');
      
      await assertSucceeds(setDoc(docRef, { name: 'Alice' }));
      await assertSucceeds(getDoc(docRef));
    });

    it('should deny a user from modifying another user profile directly', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const bobRef = doc(alice.firestore(), 'users/bob');
      
      await assertFails(setDoc(bobRef, { name: 'Hacked by Alice' }));
    });

    it('should allow a user to read and write nested collections in their own space', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const diaryRef = doc(alice.firestore(), 'users/alice/diaryCards/2026-05-14');
      const sharedRef = doc(alice.firestore(), 'users/alice/sharedWith/someClinician');
      
      await assertSucceeds(setDoc(diaryRef, { feeling: 'good' }));
      await assertSucceeds(getDoc(sharedRef));
    });
  });

  describe('2. Public Profile Access', () => {
    it('should allow any authenticated user to read another user profile', async () => {
      const alice = testEnv.authenticatedContext('alice');
      
      // Setup Bob's profile as an admin (unauthenticated) to bypass rules for setup
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users/bob'), { role: 'clinician' });
      });

      const bobRef = doc(alice.firestore(), 'users/bob');
      await assertSucceeds(getDoc(bobRef));
    });

    it('should deny unauthenticated users from reading profiles', async () => {
      const unauth = testEnv.unauthenticatedContext();
      const bobRef = doc(unauth.firestore(), 'users/bob');
      
      await assertFails(getDoc(bobRef));
    });
  });

  describe('3. Clinician Access (via sharedWith)', () => {
    it('should deny a clinician access to a patient if not in sharedWith', async () => {
      const clinician = testEnv.authenticatedContext('dr_smith');
      const patientDiaryRef = doc(clinician.firestore(), 'users/patientA/diaryCards/doc1');
      
      await assertFails(getDoc(patientDiaryRef));
    });

    it('should allow a clinician access to a patient if in sharedWith', async () => {
      const clinician = testEnv.authenticatedContext('dr_smith');
      const patientDiaryRef = doc(clinician.firestore(), 'users/patientA/diaryCards/doc1');
      
      // Setup the ACL entry for Dr. Smith in Patient A's sharedWith
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users/patientA/sharedWith/dr_smith'), { name: 'Dr. Smith' });
        await setDoc(doc(context.firestore(), 'users/patientA/diaryCards/doc1'), { data: 'test' });
      });
      
      await assertSucceeds(getDoc(patientDiaryRef));
    });

    it('should allow clinicians to read their own entry in a patients sharedWith list', async () => {
      const clinician = testEnv.authenticatedContext('dr_smith');
      const aclRef = doc(clinician.firestore(), 'users/patientA/sharedWith/dr_smith');
      
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users/patientA/sharedWith/dr_smith'), { name: 'Dr. Smith' });
      });

      await assertSucceeds(getDoc(aclRef));
    });
    
    it('should deny clinicians from reading other entries in a patients sharedWith list', async () => {
      const clinician = testEnv.authenticatedContext('dr_smith');
      const otherAclRef = doc(clinician.firestore(), 'users/patientA/sharedWith/dr_jones');
      
      await assertFails(getDoc(otherAclRef));
    });
  });

  describe('4. Handshake Logic', () => {
    it('should allow a patient to write themselves to a clinicians roster', async () => {
      const patient = testEnv.authenticatedContext('patientA');
      const rosterRef = doc(patient.firestore(), 'users/dr_smith/roster/patientA');
      
      await assertSucceeds(setDoc(rosterRef, { name: 'Patient A' }));
    });

    it('should deny a patient from writing SOMEONE ELSE to a clinicians roster', async () => {
      const patient = testEnv.authenticatedContext('patientA');
      const rosterRef = doc(patient.firestore(), 'users/dr_smith/roster/patientB');
      
      await assertFails(setDoc(rosterRef, { name: 'Patient B' }));
    });

    it('should execute a successful dual-write handshake (Batch)', async () => {
      const patient = testEnv.authenticatedContext('patientA');
      const db = patient.firestore();
      
      const batch = writeBatch(db);
      
      // 1. Add to Clinician's roster
      const rosterRef = doc(db, 'users/dr_smith/roster/patientA');
      batch.set(rosterRef, { name: 'Patient A' });

      // 2. Add Clinician to Patient's sharedWith
      const sharedWithRef = doc(db, 'users/patientA/sharedWith/dr_smith');
      batch.set(sharedWithRef, { name: 'Dr. Smith' });

      await assertSucceeds(batch.commit());
    });
  });
});
