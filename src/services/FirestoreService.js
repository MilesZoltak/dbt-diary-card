import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

class FirestoreService {
  /**
   * Creates or updates a user profile
   */
  async createUserProfile(uid, data) {
    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Fetches a user profile
   */
  async getUserProfile(uid) {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Adds a patient to a clinician's roster and grants the clinician access to the patient's data.
   * This is a dual-write handshake that must be executed by the patient.
   */
  async addToRoster(clinicianUid, patientUid, patientProfileData, clinicianProfileData = { displayName: 'Clinician' }) {
    try {
      const batch = writeBatch(db);
      
      // 1. Add patient to clinician's roster (Index for Dashboard)
      const rosterRef = doc(db, 'users', clinicianUid, 'roster', patientUid);
      batch.set(rosterRef, {
        ...patientProfileData,
        addedAt: new Date().toISOString()
      }, { merge: true });

      // 2. Add clinician to patient's sharedWith collection (ACL for Security)
      const sharedWithRef = doc(db, 'users', patientUid, 'sharedWith', clinicianUid);
      batch.set(sharedWithRef, {
        ...clinicianProfileData,
        addedAt: new Date().toISOString()
      }, { merge: true });

      await batch.commit();
    } catch (error) {
      console.error('Error executing dual-write handshake:', error);
      throw error;
    }
  }

  /**
   * Gets a list of patients in the clinician's roster
   */
  async getPatientsForClinician(clinicianUid) {
    try {
      const rosterRef = collection(db, 'users', clinicianUid, 'roster');
      const querySnapshot = await getDocs(rosterRef);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
    } catch (error) {
      console.error('Error fetching patients for clinician:', error);
      throw error;
    }
  }

  /**
   * Removes a patient from a clinician's roster
   */
  async removeFromRoster(clinicianUid, patientUid) {
    try {
      const rosterRef = doc(db, 'users', clinicianUid, 'roster', patientUid);
      await deleteDoc(rosterRef);
    } catch (error) {
      console.error('Error removing patient from roster:', error);
      throw error;
    }
  }

  /**
   * Gets a list of clinicians a patient is sharing data with
   */
  async getSharedWith(patientUid) {
    try {
      const sharedWithRef = collection(db, 'users', patientUid, 'sharedWith');
      const querySnapshot = await getDocs(sharedWithRef);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
    } catch (error) {
      console.error('Error fetching sharedWith list:', error);
      throw error;
    }
  }

  /**
   * Revokes a clinician's access to a patient's data
   * This is a dual-delete that removes both the ACL entry and the Roster index.
   */
  async revokeAccess(patientUid, clinicianUid) {
    try {
      const batch = writeBatch(db);
      
      // 1. Remove from Patient's ACL
      const sharedWithRef = doc(db, 'users', patientUid, 'sharedWith', clinicianUid);
      batch.delete(sharedWithRef);
      
      // 2. Remove from Clinician's Roster
      const rosterRef = doc(db, 'users', clinicianUid, 'roster', patientUid);
      batch.delete(rosterRef);
      
      await batch.commit();
    } catch (error) {
      console.error('Error revoking access:', error);
      throw error;
    }
  }

  /**
   * Fetches the active template for a user
   */
  async fetchActiveTemplate(userId) {
    try {
      const templatesRef = collection(db, 'users', userId, 'templates');
      const q = query(templatesRef, where('isActive', '==', true), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching active template:', error);
      throw error;
    }
  }

  /**
   * Saves a new or updated template for a user
   */
  async saveTemplate(userId, templateId, templateData, makeActive = true) {
    try {
      const docRef = doc(db, 'users', userId, 'templates', templateId);
      
      // If we are making this active, we should technically set others to inactive.
      // For MVP, we will assume this query handles the active state properly if we enforce one.
      if (makeActive) {
        const templatesRef = collection(db, 'users', userId, 'templates');
        const q = query(templatesRef, where('isActive', '==', true));
        const activeSnaps = await getDocs(q);
        const updates = activeSnaps.docs.map(d => 
          setDoc(d.ref, { isActive: false }, { merge: true })
        );
        await Promise.all(updates);
      }

      await setDoc(docRef, { 
        ...templateData, 
        isActive: makeActive,
        updatedAt: new Date().toISOString() 
      }, { merge: true });
      
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  }

  /**
   * Fetches diary cards (entries) for a specific user
   */
  async fetchDiaryCards(userId, limitCount = 100) {
    try {
      const cardsRef = collection(db, 'users', userId, 'diaryCards');
      const q = query(cardsRef, orderBy('logicalDate', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
    } catch (error) {
      console.error('Error fetching diary cards:', error);
      throw error;
    }
  }

  /**
   * Saves or updates a diary card for a specific date
   * Payload should match the Spec 02 format
   */
  async saveDiaryCard(userId, logicalDate, payload) {
    try {
      const docRef = doc(db, 'users', userId, 'diaryCards', logicalDate);
      await setDoc(docRef, {
        ...payload,
        logicalDate: logicalDate,
        lastModified: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving diary card:', error);
      throw error;
    }
  }
}

export default new FirestoreService();
