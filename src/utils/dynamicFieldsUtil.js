import { db } from '../firebase';
import { 
  collection, query, where, getDocs, orderBy, limit, 
  addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDoc 
} from 'firebase/firestore';

const CACHE_KEY = 'dynamicFieldsCache';
const COLLECTION_NAME = 'dynamicFields';

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

const validateFieldData = (fieldData) => {
  if (!fieldData || typeof fieldData !== 'object') {
    throw new Error('Invalid field data');
  }
  // Add more specific validations here if needed
};

/**
 * Fetches dynamic fields for a given user ID.
 * @param {string} userId - The user ID to fetch dynamic fields for.
 * @param {number} [maxResults=100] - Maximum number of results to return.
 * @returns {Promise<Array>} An array of dynamic field objects.
 * @throws {Error} If no user ID is provided or if there's an error fetching the data.
 */
export const fetchDynamicFields = async (userId, maxResults = 100) => {
  validateUserId(userId);

  try {
    const cachedData = getCache(userId);
    if (cachedData) {
      console.log('fetchDynamicFields: Using cached data');
      return cachedData.slice(0, maxResults);
    }

    console.log('fetchDynamicFields: Fetching from database');
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      orderBy("order", "asc"),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    const fields = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
    }));

    setCache(userId, fields);
    console.log(`fetchDynamicFields: Fetched and cached ${fields.length} fields`);

    return fields;
  } catch (error) {
    console.error('Error fetching dynamic fields:', error);
    throw new Error('Failed to fetch dynamic fields');
  }
};

/**
 * Adds a new dynamic field for a user.
 * @param {string} userId - The user ID to add the field for.
 * @param {Object} fieldData - The field data to add.
 * @returns {Promise<string>} The ID of the newly added field document.
 * @throws {Error} If no user ID is provided, if fieldData is invalid, or if there's an error adding the data.
 */
export const addDynamicField = async (userId, fieldData) => {
  validateUserId(userId);
  validateFieldData(fieldData);

  try {
    console.log('addDynamicField: Adding to database');
    const dynamicFieldsRef = collection(db, COLLECTION_NAME);
    const newFieldRef = await addDoc(dynamicFieldsRef, {
      ...fieldData,
      userId,
      timestamp: serverTimestamp()
    });

    const cachedData = getCache(userId) || [];
    const newField = { id: newFieldRef.id, ...fieldData, userId, timestamp: new Date() };
    setCache(userId, [...cachedData, newField]);
    console.log(`addDynamicField: Added new field with ID ${newFieldRef.id}`);

    return newFieldRef.id;
  } catch (error) {
    console.error('Error adding dynamic field:', error);
    throw new Error('Failed to add dynamic field');
  }
};

/**
 * Updates an existing dynamic field.
 * @param {string} userId - The user ID to update the field for.
 * @param {string} fieldId - The ID of the field to update.
 * @param {Object} updateData - The data to update the field with.
 * @throws {Error} If no user ID or field ID is provided, if updateData is invalid, or if there's an error updating the data.
 */
export const updateDynamicField = async (userId, fieldId, updateData) => {
  validateUserId(userId);
  if (!fieldId) throw new Error('No field ID provided');
  validateFieldData(updateData);

  try {
    console.log(`updateDynamicField: Updating field ${fieldId}`);
    const fieldRef = doc(db, COLLECTION_NAME, fieldId);
    
    // Verify the field belongs to the user
    const fieldDoc = await getDoc(fieldRef);
    if (!fieldDoc.exists() || fieldDoc.data().userId !== userId) {
      throw new Error('Field not found or user does not have permission to update');
    }

    await updateDoc(fieldRef, {
      ...updateData,
      lastUpdated: serverTimestamp()
    });

    const cachedData = getCache(userId) || [];
    const updatedFields = cachedData.map(field => 
      field.id === fieldId ? { ...field, ...updateData, lastUpdated: new Date() } : field
    );
    setCache(userId, updatedFields);
    console.log(`updateDynamicField: Updated field ${fieldId}`);
  } catch (error) {
    console.error('Error updating dynamic field:', error);
    throw new Error('Failed to update dynamic field');
  }
};

/**
 * Deletes a dynamic field.
 * @param {string} userId - The user ID to delete the field for.
 * @param {string} fieldId - The ID of the field to delete.
 * @throws {Error} If no user ID or field ID is provided, or if there's an error deleting the field.
 */
export const deleteDynamicField = async (userId, fieldId) => {
  validateUserId(userId);
  if (!fieldId) throw new Error('No field ID provided');

  try {
    console.log(`deleteDynamicField: Deleting field ${fieldId}`);
    const fieldRef = doc(db, COLLECTION_NAME, fieldId);
    const fieldDoc = await getDoc(fieldRef);
    
    if (!fieldDoc.exists()) {
      throw new Error('Field not found');
    }
    
    if (fieldDoc.data().userId !== userId) {
      throw new Error('User does not have permission to delete this field');
    }
    
    await deleteDoc(fieldRef);

    const cachedData = getCache(userId) || [];
    const updatedFields = cachedData.filter(field => field.id !== fieldId);
    setCache(userId, updatedFields);
    console.log(`deleteDynamicField: Deleted field ${fieldId}`);
  } catch (error) {
    console.error('Error deleting dynamic field:', error);
    throw error;
  }
};
