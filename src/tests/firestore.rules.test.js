import { readFileSync } from 'fs';
import { resolve } from 'path';
import { 
  initializeTestEnvironment, 
  assertSucceeds, 
  assertFails 
} from '@firebase/rules-unit-testing';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { 
  setDoc, 
  getDoc, 
  collection, 
  getDocs,
  doc 
} from 'firebase/firestore';

const PROJECT_ID = 'fractal-rosette-test';
let testEnv;

describe('Firestore Security Rules (Flat Structure)', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
        host: 'localhost',
        port: 8081,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  const getFirestore = (auth) => testEnv.authenticatedContext(auth.uid).firestore();

  describe('Owner Access', () => {
    it('allows a patient to read/write their own sharedWith documents', async () => {
      const db = getFirestore({ uid: 'patient1' });
      const sharedDoc = doc(db, 'users/patient1/sharedWith/clinician1');
      await assertSucceeds(setDoc(sharedDoc, { name: 'Dr. Smith' }));
      await assertSucceeds(getDoc(sharedDoc));
    });

    it('allows a patient to LIST their own sharedWith collection even if it is empty/non-existent', async () => {
      const db = getFirestore({ uid: 'new_user_empty' });
      await assertSucceeds(getDocs(collection(db, 'users/new_user_empty/sharedWith')));
    });

    it('allows a clinician to read their own roster', async () => {
      const db = getFirestore({ uid: 'clinician1' });
      await assertSucceeds(getDocs(collection(db, 'users/clinician1/roster')));
    });
  });

  describe('Clinician Access', () => {
    it('allows a clinician to read their own entry in a patients sharedWith', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'users/patient1/sharedWith/clinician1'), { active: true });
      });

      const db = getFirestore({ uid: 'clinician1' });
      await assertSucceeds(getDoc(doc(db, 'users/patient1/sharedWith/clinician1')));
    });

    it('denies a clinician from reading ANOTHER clinicians entry in a patients sharedWith', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'users/patient1/sharedWith/clinician1'), { active: true });
      });

      const db = getFirestore({ uid: 'clinician2' });
      await assertFails(getDoc(doc(db, 'users/patient1/sharedWith/clinician1')));
    });
  });
});
