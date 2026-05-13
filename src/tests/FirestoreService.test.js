import { describe, it, expect, vi, beforeEach } from 'vitest';
import FirestoreService from '../services/FirestoreService';
import * as firestore from 'firebase/firestore';

// Mock firebase/firestore
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    getDocs: vi.fn(),
    writeBatch: vi.fn(() => ({
      set: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(true)
    }))
  };
});

describe('FirestoreService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addToRoster', () => {
    it('should execute a batch write to roster and sharedWith', async () => {
      const batch = firestore.writeBatch();
      vi.mocked(firestore.writeBatch).mockReturnValue(batch);

      await FirestoreService.addToRoster(
        'clinician1', 
        'patient1', 
        { name: 'Patient' }, 
        { name: 'Clinician' }
      );

      expect(batch.set).toHaveBeenCalledTimes(2);
      expect(batch.commit).toHaveBeenCalled();
    });
  });

  describe('revokeAccess', () => {
    it('should execute a batch delete from roster and sharedWith', async () => {
      const batch = firestore.writeBatch();
      vi.mocked(firestore.writeBatch).mockReturnValue(batch);

      await FirestoreService.revokeAccess('patient1', 'clinician1');

      expect(batch.delete).toHaveBeenCalledTimes(2);
      expect(batch.commit).toHaveBeenCalled();
    });
  });

  describe('fetchActiveTemplate', () => {
    it('should return the first active template', async () => {
      const mockSnap = {
        empty: false,
        docs: [{
          id: 't1',
          data: () => ({ isActive: true, sections: [] })
        }]
      };
      vi.mocked(firestore.getDocs).mockResolvedValue(mockSnap);

      const template = await FirestoreService.fetchActiveTemplate('user1');
      expect(template.id).toBe('t1');
      expect(firestore.query).toHaveBeenCalled();
    });
  });
});
