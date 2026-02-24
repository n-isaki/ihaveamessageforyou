import {
  createGift,
  updateGift,
  deleteGift,
  getGifts,
  getGiftById,
  createEtsyOrder,
  markGiftAsViewed,
  markSetupAsStarted,
} from './gifts';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { auth } from '../firebase';
import { getExperience } from '../modules/registry';
import { hashPin } from './pinSecurity';
import { deleteAllAlbumImages } from './albumUpload';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('firebase/storage');
jest.mock('../firebase');
jest.mock('../modules/registry');
jest.mock('./pinSecurity');
jest.mock('./albumUpload');

describe('Gifts Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    auth.currentUser = { uid: 'test-user', email: 'test@example.com' };
    serverTimestamp.mockReturnValue(new Date('2024-01-01'));
    hashPin.mockResolvedValue('hashed-pin');
    getExperience.mockReturnValue({ isSetupRequired: true });
    deleteAllAlbumImages.mockResolvedValue();
  });

  describe('createGift', () => {
    const mockGiftData = {
      recipientName: 'John Doe',
      senderName: 'Jane Smith',
      productType: 'noor',
      accessCode: '1234',
    };

    test('creates gift with required fields', async () => {
      const mockDocRef = { id: 'test-gift-id' };
      addDoc.mockResolvedValue(mockDocRef);

      const result = await createGift(mockGiftData);

      expect(addDoc).toHaveBeenCalledWith(
        collection(),
        expect.objectContaining({
          recipientName: 'John Doe',
          senderName: 'Jane Smith',
          productType: 'noor',
          status: 'open',
          platform: 'manual',
          securityToken: expect.any(String),
          contributionToken: expect.any(String),
          accessCodeHash: 'hashed-pin',
          locked: false,
          setupStarted: false,
          isPublic: false,
          createdAt: serverTimestamp(),
          viewed: false,
          viewedAt: null,
        })
      );
      expect(result).toBe('test-gift-id');
    });

    test('handles products that do not require setup', async () => {
      getExperience.mockReturnValue({ isSetupRequired: false });
      const mockDocRef = { id: 'test-gift-id' };
      addDoc.mockResolvedValue(mockDocRef);

      await createGift(mockGiftData);

      expect(addDoc).toHaveBeenCalledWith(
        collection(),
        expect.objectContaining({
          locked: true, // Should be locked when setup is not required
        })
      );
    });

    test('handles missing access code', async () => {
      const giftWithoutPin = { ...mockGiftData, accessCode: '' };
      const mockDocRef = { id: 'test-gift-id' };
      addDoc.mockResolvedValue(mockDocRef);

      await createGift(giftWithoutPin);

      expect(hashPin).not.toHaveBeenCalled();
      expect(addDoc).toHaveBeenCalledWith(
        collection(),
        expect.not.objectContaining({
          accessCodeHash: expect.any(String),
        })
      );
    });

    test('handles pin hashing errors gracefully', async () => {
      hashPin.mockRejectedValue(new Error('Hashing failed'));
      const mockDocRef = { id: 'test-gift-id' };
      addDoc.mockResolvedValue(mockDocRef);

      await createGift(mockGiftData);

      expect(addDoc).toHaveBeenCalledWith(
        collection(),
        expect.not.objectContaining({
          accessCodeHash: expect.any(String),
        })
      );
    });

    test('throws error when creation fails', async () => {
      addDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(createGift(mockGiftData)).rejects.toThrow('Firebase error');
    });
  });

  describe('createEtsyOrder', () => {
    const mockEtsyData = {
      recipientName: 'John Doe',
      senderName: 'Jane Smith',
      personalizationText: 'Happy Birthday',
      etsyOrderId: 'etsy-123',
      productType: 'tasse',
    };

    test('creates etsy order with correct fields', async () => {
      const mockDocRef = { id: 'test-etsy-id' };
      addDoc.mockResolvedValue(mockDocRef);

      const result = await createEtsyOrder(mockEtsyData);

      expect(addDoc).toHaveBeenCalledWith(
        collection(),
        expect.objectContaining({
          ...mockEtsyData,
          status: 'open',
          platform: 'etsy',
          securityToken: expect.any(String),
          contributionToken: expect.any(String),
          allowContributions: false,
          locked: false,
          createdAt: serverTimestamp(),
          viewed: false,
          setupStarted: false,
        })
      );
      expect(result).toBe('test-etsy-id');
    });
  });

  describe('updateGift', () => {
    const giftId = 'test-gift-id';
    const updateData = {
      recipientName: 'Updated Name',
      accessCode: '5678',
    };

    test('updates gift with timestamp', async () => {
      updateDoc.mockResolvedValue();

      await updateGift(giftId, updateData);

      expect(updateDoc).toHaveBeenCalledWith(
        doc(),
        expect.objectContaining({
          recipientName: 'Updated Name',
          accessCodeHash: 'hashed-pin',
          updatedAt: serverTimestamp(),
        })
      );
    });

    test('removes access code hash when pin is cleared', async () => {
      const updateWithoutPin = { accessCode: '' };
      updateDoc.mockResolvedValue();

      await updateGift(giftId, updateWithoutPin);

      expect(updateDoc).toHaveBeenCalledWith(
        doc(),
        expect.objectContaining({
          accessCodeHash: null,
        })
      );
    });

    test('throws error when update fails', async () => {
      updateDoc.mockRejectedValue(new Error('Update failed'));

      await expect(updateGift(giftId, updateData)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteGift', () => {
    const giftId = 'test-gift-id';
    const mockGift = {
      id: giftId,
      audioUrl: 'https://firebasestorage.googleapis.com/audio.mp3',
      designImage: 'https://firebasestorage.googleapis.com/image.jpg',
      albumImages: ['image1.jpg', 'image2.jpg'],
    };

    test('deletes gift and associated files', async () => {
      getDoc.mockResolvedValue({ exists: () => true, data: () => mockGift });
      deleteDoc.mockResolvedValue();

      await deleteGift(giftId);

      expect(deleteObject).toHaveBeenCalledTimes(2); // audioUrl + designImage
      expect(deleteAllAlbumImages).toHaveBeenCalledWith(mockGift.albumImages);
      expect(deleteDoc).toHaveBeenCalledWith(doc());
    });

    test('handles non-existent gift gracefully', async () => {
      getDoc.mockResolvedValue({ exists: () => false });
      deleteDoc.mockResolvedValue();

      await deleteGift(giftId);

      expect(deleteObject).not.toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalledWith(doc());
    });

    test('ignores storage deletion errors', async () => {
      getDoc.mockResolvedValue({ exists: () => true, data: () => mockGift });
      deleteObject.mockRejectedValue(new Error('File not found'));
      deleteDoc.mockResolvedValue();

      await deleteGift(giftId);

      expect(deleteDoc).toHaveBeenCalled(); // Should still delete the document
    });
  });

  describe('getGifts', () => {
    test('returns gifts ordered by creation date', async () => {
      const mockDocs = [
        { id: 'gift1', data: () => ({ recipientName: 'Gift 1' }) },
        { id: 'gift2', data: () => ({ recipientName: 'Gift 2' }) },
      ];
      getDocs.mockResolvedValue({ docs: mockDocs });

      const result = await getGifts();

      expect(getDocs).toHaveBeenCalledWith(
        expect.objectContaining({
          _queryOptions: expect.objectContaining({
            orderBy: [['createdAt', 'desc']],
          }),
        })
      );
      expect(result).toEqual([
        { id: 'gift1', recipientName: 'Gift 1' },
        { id: 'gift2', recipientName: 'Gift 2' },
      ]);
    });
  });

  describe('getGiftById', () => {
    const giftId = 'test-gift-id';
    const mockGift = { id: giftId, recipientName: 'Test Gift' };

    test('returns gift when found', async () => {
      getDoc.mockResolvedValue({ exists: () => true, data: () => mockGift });

      const result = await getGiftById(giftId);

      expect(result).toEqual({ id: giftId, ...mockGift });
    });

    test('returns null when gift not found after retries', async () => {
      getDoc.mockResolvedValue({ exists: () => false });

      const result = await getGiftById(giftId, 2);

      expect(result).toBeNull();
      expect(getDoc).toHaveBeenCalledTimes(2);
    });

    test('retries on temporary errors', async () => {
      getDoc
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({ exists: () => true, data: () => mockGift });

      const result = await getGiftById(giftId, 2);

      expect(result).toEqual({ id: giftId, ...mockGift });
      expect(getDoc).toHaveBeenCalledTimes(2);
    });

    test('handles permission denied errors', async () => {
      const permissionError = new Error('Permission denied');
      permissionError.code = 'permission-denied';
      getDoc.mockRejectedValue(permissionError);

      // Mock the dynamic import
      const { getPublicGiftData } = await import('./pinSecurity');
      getPublicGiftData.mockResolvedValue({
        exists: true,
        publicData: { id: giftId, recipientName: 'Public Gift' },
      });

      const result = await getGiftById(giftId);

      expect(getPublicGiftData).toHaveBeenCalledWith(giftId);
      expect(result).toEqual({ id: giftId, recipientName: 'Public Gift' });
    });
  });

  describe('markGiftAsViewed', () => {
    const giftId = 'test-gift-id';

    test('marks gift as viewed with timestamp', async () => {
      updateDoc.mockResolvedValue();

      await markGiftAsViewed(giftId);

      expect(updateDoc).toHaveBeenCalledWith(
        doc(),
        {
          viewed: true,
          viewedAt: serverTimestamp(),
        }
      );
    });

    test('throws error when marking fails', async () => {
      updateDoc.mockRejectedValue(new Error('Update failed'));

      await expect(markGiftAsViewed(giftId)).rejects.toThrow('Update failed');
    });
  });

  describe('markSetupAsStarted', () => {
    const giftId = 'test-gift-id';

    test('marks setup as started with timestamp', async () => {
      updateDoc.mockResolvedValue();

      await markSetupAsStarted(giftId);

      expect(updateDoc).toHaveBeenCalledWith(
        doc(),
        {
          setupStarted: true,
          setupStartedAt: serverTimestamp(),
        }
      );
    });

    test('does not throw error when marking fails', async () => {
      updateDoc.mockRejectedValue(new Error('Update failed'));

      // Should not throw
      await expect(markSetupAsStarted(giftId)).resolves.toBeUndefined();
    });
  });
});
