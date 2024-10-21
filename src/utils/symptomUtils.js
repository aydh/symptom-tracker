import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const CACHE_KEY = 'symptomDataCache';

const getCache = (userId) => {
  const cache = localStorage.getItem(`${CACHE_KEY}_${userId}`);
  return cache ? JSON.parse(cache) : null;
};

const setCache = (userId, data) => {
  localStorage.setItem(`${CACHE_KEY}_${userId}`, JSON.stringify(data));
};

/**
 * Fetches symptom data for a given user ID.
 * @param {string} userId - The user ID to fetch symptoms for.
 * @param {number} [maxResults=100] - Maximum number of results to return.
 * @returns {Promise<Array>} An array of symptom data objects.
 * @throws {Error} If no user ID is provided or if there's an error fetching the data.
 */
export const fetchSymptomData = async (userId, maxResults = 100) => {
  if (!userId) {
    throw new Error('No user ID provided');
  }

  try {
    // Check cache first
    const cachedData = getCache(userId);
    if (cachedData) {
      console.log('fetchSymptomData: Using cached data');
      return cachedData.slice(0, maxResults);
    }

    console.log('fetchSymptomData: Fetching from database');
    const symptomsRef = collection(db, "symptoms");
    const q = query(
      symptomsRef,
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    
    const symptoms = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp)
      };
    });

    // Update cache
    setCache(userId, symptoms);
    console.log('fetchSymptomData: Updated cache with fetched data');

    return symptoms;
  } catch (error) {
    console.error('Error fetching symptom data:', error);
    throw new Error('Failed to fetch symptom data');
  }
};

/**
 * Adds a new symptom entry for a user.
 * @param {string} userId - The user ID to add the symptom for.
 * @param {Object} symptomData - The symptom data to add.
 * @returns {Promise<string>} The ID of the newly added symptom document.
 * @throws {Error} If no user ID is provided, if symptomData is invalid, or if there's an error adding the data.
 */
export const addSymptomEntry = async (userId, symptomData) => {
  if (!userId) {
    throw new Error('No user ID provided');
  }

  if (!symptomData || typeof symptomData !== 'object') {
    throw new Error('Invalid symptom data');
  }

  try {
    console.log('addSymptomEntry: Adding to database');
    const symptomsRef = collection(db, "symptoms");
    const newSymptomRef = await addDoc(symptomsRef, {
      ...symptomData,
      userId,
      timestamp: serverTimestamp()
    });

    // Update cache
    const cachedData = getCache(userId) || [];
    const newSymptom = { id: newSymptomRef.id, ...symptomData, userId, timestamp: new Date() };
    setCache(userId, [newSymptom, ...cachedData]);
    console.log('addSymptomEntry: Updated cache with new symptom');

    return newSymptomRef.id;
  } catch (error) {
    console.error('Error adding symptom entry:', error);
    throw new Error('Failed to add symptom entry');
  }
};

/**
 * Updates an existing symptom entry.
 * @param {string} symptomId - The ID of the symptom entry to update.
 * @param {Object} updateData - The data to update the symptom entry with.
 * @throws {Error} If no symptom ID is provided, if updateData is invalid, or if there's an error updating the data.
 */
export const updateSymptomEntry = async (symptomId, updateData) => {
  if (!symptomId) {
    throw new Error('No symptom ID provided');
  }

  if (!updateData || typeof updateData !== 'object') {
    throw new Error('Invalid update data');
  }

  try {
    console.log('updateSymptomEntry: Updating in database');
    const symptomRef = doc(db, "symptoms", symptomId);
    await updateDoc(symptomRef, {
      ...updateData,
      lastUpdated: serverTimestamp()
    });

    // Update cache
    const symptomDoc = await getDocs(symptomRef);
    if (symptomDoc.exists()) {
      const userId = symptomDoc.data().userId;
      const cachedData = getCache(userId) || [];
      const updatedSymptoms = cachedData.map(symptom => 
        symptom.id === symptomId ? { ...symptom, ...updateData, lastUpdated: new Date() } : symptom
      );
      setCache(userId, updatedSymptoms);
      console.log('updateSymptomEntry: Updated cache with modified symptom');
    }
  } catch (error) {
    console.error('Error updating symptom entry:', error);
    throw new Error('Failed to update symptom entry');
  }
};

/**
 * Deletes a symptom entry.
 * @param {string} symptomId - The ID of the symptom entry to delete.
 * @throws {Error} If no symptom ID is provided or if there's an error deleting the entry.
 */
export const deleteSymptomEntry = async (symptomId) => {
  if (!symptomId) {
    throw new Error('No symptom ID provided');
  }

  try {
    console.log('deleteSymptomEntry: Deleting from database');
    const symptomRef = doc(db, "symptoms", symptomId);
    const symptomDoc = await getDocs(symptomRef);
    
    if (symptomDoc.exists()) {
      const userId = symptomDoc.data().userId;
      await deleteDoc(symptomRef);

      // Update cache
      const cachedData = getCache(userId) || [];
      const updatedSymptoms = cachedData.filter(symptom => symptom.id !== symptomId);
      setCache(userId, updatedSymptoms);
      console.log('deleteSymptomEntry: Updated cache after deletion');
    } else {
      throw new Error('Symptom not found');
    }
  } catch (error) {
    console.error('Error deleting symptom entry:', error);
    throw new Error('Failed to delete symptom entry');
  }
};

// Add more utility functions as needed, e.g., updateSymptomEntry, deleteSymptomEntry, etc.
