import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';

const CACHE_KEY = 'dynamicFieldsCache';

const getCache = (userId) => {
  const cache = localStorage.getItem(`${CACHE_KEY}_${userId}`);
  return cache ? JSON.parse(cache) : null;
};

const setCache = (userId, data) => {
  localStorage.setItem(`${CACHE_KEY}_${userId}`, JSON.stringify(data));
};

/**
 * Fetches dynamic fields for a given user ID.
 * @param {string} userId - The user ID to fetch dynamic fields for.
 * @param {number} [maxResults=100] - Maximum number of results to return.
 * @returns {Promise<Array>} An array of dynamic field objects.
 * @throws {Error} If no user ID is provided or if there's an error fetching the data.
 */
export const fetchDynamicFields = async (userId, maxResults = 100) => {
  if (!userId) {
    throw new Error('No user ID provided');
  }

  try {
    // Check cache first
    const cachedData = getCache(userId);
    if (cachedData) {
      console.log('fetchDynamicFields: Using cached data');
      return cachedData.slice(0, maxResults);
    }

    console.log('fetchDynamicFields: Fetching from database');
    const q = query(
      collection(db, "dynamicFields"),
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

    // Update cache
    setCache(userId, fields);
    console.log('fetchDynamicFields: Updated cache with fetched data');

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
  if (!userId) {
    throw new Error('No user ID provided');
  }

  if (!fieldData || typeof fieldData !== 'object') {
    throw new Error('Invalid field data');
  }

  try {
    console.log('addDynamicField: Adding to database');
    const dynamicFieldsRef = collection(db, "dynamicFields");
    const newFieldRef = await addDoc(dynamicFieldsRef, {
      ...fieldData,
      userId,
      timestamp: serverTimestamp()
    });

    // Update cache
    const cachedData = getCache(userId) || [];
    const newField = { id: newFieldRef.id, ...fieldData, userId, timestamp: new Date() };
    setCache(userId, [...cachedData, newField]);
    console.log('addDynamicField: Updated cache with new field');

    return newFieldRef.id;
  } catch (error) {
    console.error('Error adding dynamic field:', error);
    throw new Error('Failed to add dynamic field');
  }
};

/**
 * Updates an existing dynamic field.
 * @param {string} fieldId - The ID of the field to update.
 * @param {Object} updateData - The data to update the field with.
 * @throws {Error} If no field ID is provided, if updateData is invalid, or if there's an error updating the data.
 */
export const updateDynamicField = async (userId, fieldId, updateData) => {
  if (!userId) {
    throw new Error('No user ID provided');
  }
  if (!fieldId) {
    throw new Error('No field ID provided');
  }

  if (!updateData || typeof updateData !== 'object') {
    throw new Error('Invalid update data');
  }

  try {
    console.log('updateDynamicField: Updating in database');
    const fieldRef = doc(db, "dynamicFields", fieldId);
    await updateDoc(fieldRef, {
      ...updateData,
      lastUpdated: serverTimestamp()
    });

    // Update cache
    const fieldDoc = await getDocs(fieldRef);
    if (fieldDoc.exists()) {
      const userId = fieldDoc.data().userId;
      const cachedData = getCache(userId) || [];
      const updatedFields = cachedData.map(field => 
        field.id === fieldId ? { ...field, ...updateData, lastUpdated: new Date() } : field
      );
      setCache(userId, updatedFields);
      console.log('updateDynamicField: Updated cache with modified field');
    }
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
  if (!userId) {
    throw new Error('No user ID provided');
  }
  if (!fieldId) {
    throw new Error('No field ID provided');
  }

  try {
    console.log('deleteDynamicField: Deleting from database');
    const fieldRef = doc(db, "dynamicFields", fieldId);
    const fieldDoc = await getDoc(fieldRef);
    
    if (fieldDoc.exists()) {
      const fieldData = fieldDoc.data();
      if (fieldData.userId !== userId) {
        throw new Error('User does not have permission to delete this field');
      }
      await deleteDoc(fieldRef);

      // Update cache
      const cachedData = getCache(userId) || [];
      const updatedFields = cachedData.filter(field => field.id !== fieldId);
      setCache(userId, updatedFields);
      console.log('deleteDynamicField: Updated cache after deletion');
    } else {
      throw new Error('Field not found');
    }
  } catch (error) {
    console.error('Error deleting dynamic field:', error);
    throw error;
  }
};
