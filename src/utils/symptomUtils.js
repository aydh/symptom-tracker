import { db } from '../firebase';
import { 
  collection, query, where, getDocs, orderBy, limit, 
  addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDoc 
} from 'firebase/firestore';

const CACHE_KEY = 'symptomsCache';
const COLLECTION_NAME = 'symptoms';

const getCache = (userId) => {
  try {
    const cache = localStorage.getItem(`${CACHE_KEY}_${userId}`);
    return cache ? JSON.parse(cache) : null;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

const setCache = (userId, data) => {
  try {
    localStorage.setItem(`${CACHE_KEY}_${userId}`, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};

const validateUserId = (userId) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid or missing user ID');
  }
};

const validateSymptomData = (symptomData) => {
  if (!symptomData || typeof symptomData !== 'object') {
    throw new Error('Invalid symptom data');
  }
  // Add more specific validations here if needed
};

/**
 * Fetches symptoms for a given user ID.
 * @param {string} userId - The user ID to fetch symptoms for.
 * @param {number} [maxResults=100] - Maximum number of results to return.
 * @returns {Promise<Array>} An array of symptom objects.
 * @throws {Error} If no user ID is provided or if there's an error fetching the data.
 */
export const fetchSymptoms = async (userId, maxResults = 100) => {
  validateUserId(userId);

  try {
    const cachedData = getCache(userId);
    if (cachedData) {
      console.log('fetchSymptoms: Using cached data');
      return cachedData.slice(0, maxResults);
    }

    console.log('fetchSymptoms: Fetching from database');
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    const symptoms = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
    }));

    setCache(userId, symptoms);
    console.log(`fetchSymptoms: Fetched and cached ${symptoms.length} symptoms`);

    return symptoms;
  } catch (error) {
    console.error('Error fetching symptoms:', error);
    throw new Error('Failed to fetch symptoms');
  }
};

/**
 * Adds a new symptom for a user.
 * @param {string} userId - The user ID to add the symptom for.
 * @param {Object} symptomData - The symptom data to add.
 * @returns {Promise<string>} The ID of the newly added symptom document.
 * @throws {Error} If no user ID is provided, if symptomData is invalid, or if there's an error adding the data.
 */
export const addSymptom = async (userId, symptomData) => {
  validateUserId(userId);
  validateSymptomData(symptomData);

  try {
    console.log('addSymptom: Adding to database');
    const symptomsRef = collection(db, COLLECTION_NAME);
    const newSymptomRef = await addDoc(symptomsRef, {
      ...symptomData,
      userId,
      timestamp: serverTimestamp()
    });

    const cachedData = getCache(userId) || [];
    const newSymptom = { id: newSymptomRef.id, ...symptomData, userId, timestamp: new Date() };
    setCache(userId, [newSymptom, ...cachedData]);
    console.log(`addSymptom: Added new symptom with ID ${newSymptomRef.id}`);

    return newSymptomRef.id;
  } catch (error) {
    console.error('Error adding symptom:', error);
    throw new Error('Failed to add symptom');
  }
};

/**
 * Updates an existing symptom.
 * @param {string} userId - The user ID to update the symptom for.
 * @param {string} symptomId - The ID of the symptom to update.
 * @param {Object} updateData - The data to update the symptom with.
 * @throws {Error} If no user ID or symptom ID is provided, if updateData is invalid, or if there's an error updating the data.
 */
export const updateSymptom = async (userId, symptomId, updateData) => {
  validateUserId(userId);
  if (!symptomId) throw new Error('No symptom ID provided');
  validateSymptomData(updateData);

  try {
    console.log(`updateSymptom: Updating symptom ${symptomId}`);
    const symptomRef = doc(db, COLLECTION_NAME, symptomId);
    
    // Verify the symptom belongs to the user
    const symptomDoc = await getDoc(symptomRef);
    if (!symptomDoc.exists() || symptomDoc.data().userId !== userId) {
      throw new Error('Symptom not found or user does not have permission to update');
    }

    await updateDoc(symptomRef, {
      ...updateData,
      lastUpdated: serverTimestamp()
    });

    const cachedData = getCache(userId) || [];
    const updatedSymptoms = cachedData.map(symptom => 
      symptom.id === symptomId ? { ...symptom, ...updateData, lastUpdated: new Date() } : symptom
    );
    setCache(userId, updatedSymptoms);
    console.log(`updateSymptom: Updated symptom ${symptomId}`);
  } catch (error) {
    console.error('Error updating symptom:', error);
    throw new Error('Failed to update symptom');
  }
};

/**
 * Deletes a symptom.
 * @param {string} userId - The user ID to delete the symptom for.
 * @param {string} symptomId - The ID of the symptom to delete.
 * @throws {Error} If no user ID or symptom ID is provided, or if there's an error deleting the symptom.
 */
export const deleteSymptom = async (userId, symptomId) => {
  validateUserId(userId);
  if (!symptomId) throw new Error('No symptom ID provided');

  try {
    console.log(`deleteSymptom: Deleting symptom ${symptomId}`);
    const symptomRef = doc(db, COLLECTION_NAME, symptomId);
    const symptomDoc = await getDoc(symptomRef);
    
    if (!symptomDoc.exists()) {
      throw new Error('Symptom not found');
    }
    
    if (symptomDoc.data().userId !== userId) {
      throw new Error('User does not have permission to delete this symptom');
    }
    
    await deleteDoc(symptomRef);

    const cachedData = getCache(userId) || [];
    const updatedSymptoms = cachedData.filter(symptom => symptom.id !== symptomId);
    setCache(userId, updatedSymptoms);
    console.log(`deleteSymptom: Deleted symptom ${symptomId}`);
  } catch (error) {
    console.error('Error deleting symptom:', error);
    throw error;
  }
};

export const getSymptomById = async (userId, symptomId) => {
  validateUserId(userId);
  if (!symptomId) throw new Error('No symptom ID provided');

  try {
    console.log(`getSymptomById: Fetching symptom ${symptomId}`);
    const symptomRef = doc(db, COLLECTION_NAME, symptomId);
    const symptomDoc = await getDoc(symptomRef);

    if (!symptomDoc.exists()) {
      throw new Error('Symptom not found');
    }

    const symptomData = symptomDoc.data();
    if (symptomData.userId !== userId) {
      throw new Error('User does not have permission to access this symptom');
    }

    return {
      id: symptomDoc.id,
      ...symptomData,
      timestamp: symptomData.timestamp?.toDate?.() || new Date(symptomData.timestamp)
    };
  } catch (error) {
    console.error('Error fetching symptom by ID:', error);
    throw new Error('Failed to fetch symptom');
  }
};

// Add more utility functions as needed, e.g., updateSymptomEntry, deleteSymptomEntry, etc.
