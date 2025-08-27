import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, getDoc, orderBy } from 'firebase/firestore';
import { parseTimestamp } from './dateUtils'; // Assuming you have this utility function

const CACHE_KEY = 'symptomsCache';
const COLLECTION_NAME = 'symptoms';
const CACHE_EXPIRATION = 60 * 60 * 1000; // 1 hour in milliseconds

const getCache = (userId) => {
  try {
    const cacheItem = localStorage.getItem(`${CACHE_KEY}_${userId}`);
    if (cacheItem) {
      const { data, timestamp } = JSON.parse(cacheItem);
      if (Date.now() - timestamp < CACHE_EXPIRATION) {
        return data;
      }
    }
    return null;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

const setCache = (userId, data) => {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`${CACHE_KEY}_${userId}`, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};

export const clearCache = (userId) => {
  validateUserId(userId);
  localStorage.removeItem(`${CACHE_KEY}_${userId}`);
};

export const refreshCache = async (userId) => {
  validateUserId(userId);
  await fetchSymptoms(userId);
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
 * Fetches symptoms for a given user ID with sorting options and optional date range.
 * @param {string} userId - The user ID to fetch symptoms for.
 * @param {string} [sortOrder='desc'] - Sort order: 'asc' for ascending, 'desc' for descending.
 * @param {Date} [startDate=null] - Optional start date to filter symptoms
 * @param {Date} [endDate=null] - Optional end date to filter symptoms
 * @returns {Promise<Array>} An array of symptom objects.
 * @throws {Error} If no user ID is provided or if there's an error fetching the data.
 */
export const fetchSymptoms = async (userId, sortOrder = 'desc', startDate = null, endDate = null) => {
  validateUserId(userId);
  if (sortOrder !== 'asc' && sortOrder !== 'desc') {
    throw new Error('Invalid sort order. Must be "asc" or "desc"');
  }

  try {
    // If we have a date range, create a specific cache key
    const hasDateRange = startDate instanceof Date && endDate instanceof Date;
    const cacheKey = `${CACHE_KEY}_${userId}`;

    // Check cache with appropriate key
    const cachedData = getCache(userId);
    if (cachedData) {
      if (hasDateRange) {
        // Filter cached data by date range
        const filteredData = cachedData.filter(symptom => {
          const symptomDate = parseTimestamp(symptom.symptomDate);
          return symptomDate >= startDate && symptomDate <= endDate;
        });
        return sortSymptoms(filteredData, sortOrder);
      }
      return sortSymptoms(cachedData, sortOrder);
    }

    let queryConstraints = [
      where("userId", "==", userId),
      orderBy("symptomDate", sortOrder)
    ];

    // Add date range constraints if provided
    if (hasDateRange) {
      queryConstraints.push(where("symptomDate", ">=", startDate));
      queryConstraints.push(where("symptomDate", "<=", endDate));
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      ...queryConstraints
    );

    const querySnapshot = await getDocs(q);
    const symptoms = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Cache the results with appropriate key
    if (hasDateRange) {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: symptoms,
        timestamp: Date.now()
      }));
    } else {
      setCache(userId, symptoms);
    }

    return symptoms;
  } catch (error) {
    console.error('Error fetching symptoms:', error);
    throw new Error('Failed to fetch symptoms');
  }
};

/**
 * Sorts an array of symptoms by symptomDate.
 * @param {Array} symptoms - The array of symptoms to sort.
 * @param {string} sortOrder - The sort order: 'asc' for ascending, 'desc' for descending.
 * @returns {Array} The sorted array of symptoms.
 */
const sortSymptoms = (symptoms, sortOrder) => {
  return symptoms.sort((a, b) => {
    const dateA = parseTimestamp(a.symptomDate);
    const dateB = parseTimestamp(b.symptomDate);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });
};

/**
 * Adds a new symptom for a user and maintains sorted cache.
 * @param {string} userId - The user ID to add the symptom for.
 * @param {Object} symptomData - The symptom data to add.
 * @returns {Promise<string>} The ID of the newly added symptom document.
 * @throws {Error} If no user ID is provided, if symptomData is invalid, or if there's an error adding the data.
 */
export const addSymptom = async (userId, symptomData) => {
  validateUserId(userId);
  validateSymptomData(symptomData);

  try {
    const symptomsRef = collection(db, COLLECTION_NAME);
    const newSymptomRef = await addDoc(symptomsRef, {
      ...symptomData,
      userId
    });

    const newSymptom = { id: newSymptomRef.id, ...symptomData, userId };
    const cachedData = getCache(userId) || [];
    const updatedCache = sortSymptoms([newSymptom, ...cachedData], 'desc');
    setCache(userId, updatedCache);

    return newSymptomRef.id;
  } catch (error) {
    console.error('Error adding symptom:', error);
    throw new Error('Failed to add symptom');
  }
};

/**
 * Updates an existing symptom and maintains sorted cache.
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
    const symptomRef = doc(db, COLLECTION_NAME, symptomId);
    
    // Verify the symptom belongs to the user
    const symptomDoc = await getDoc(symptomRef);
    if (!symptomDoc.exists() || symptomDoc.data().userId !== userId) {
      throw new Error('Symptom not found or user does not have permission to update');
    }

    await updateDoc(symptomRef, updateData);

    const cachedData = getCache(userId) || [];
    const updatedSymptoms = cachedData.map(symptom => 
      symptom.id === symptomId ? { ...symptom, ...updateData } : symptom
    );
    const sortedSymptoms = sortSymptoms(updatedSymptoms, 'desc');
    setCache(userId, sortedSymptoms);
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
  } catch (error) {
    console.error('Error deleting symptom:', error);
    throw error;
  }
};

/**
 * Get a symptom by its ID
 * @param {string} userId - The user ID to get the symptom for.
 * @param {string} symptomId - The ID of the symptom to get.
 * @throws {Error} If no user ID or symptom ID is provided.
 */
export const getSymptomById = async (userId, symptomId) => {
  validateUserId(userId);
  if (!symptomId) throw new Error('No symptom ID provided');

  try {
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
      ...symptomData
    };
  } catch (error) {
    console.error('Error fetching symptom by ID:', error);
    throw new Error('Failed to fetch symptom');
  }
};
