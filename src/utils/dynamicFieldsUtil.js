import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';

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
    const q = query(
      collection(db, "dynamicFields"),
      where("userId", "==", userId),
      orderBy("order", "asc"),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
    }));
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
    const dynamicFieldsRef = collection(db, "dynamicFields");
    const newFieldRef = await addDoc(dynamicFieldsRef, {
      ...fieldData,
      userId,
      timestamp: serverTimestamp()
    });

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
export const updateDynamicField = async (fieldId, updateData) => {
  if (!fieldId) {
    throw new Error('No field ID provided');
  }

  if (!updateData || typeof updateData !== 'object') {
    throw new Error('Invalid update data');
  }

  try {
    const fieldRef = doc(db, "dynamicFields", fieldId);
    await updateDoc(fieldRef, {
      ...updateData,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating dynamic field:', error);
    throw new Error('Failed to update dynamic field');
  }
};

/**
 * Deletes a dynamic field.
 * @param {string} fieldId - The ID of the field to delete.
 * @throws {Error} If no field ID is provided or if there's an error deleting the field.
 */
export const deleteDynamicField = async (fieldId) => {
  if (!fieldId) {
    throw new Error('No field ID provided');
  }

  try {
    const fieldRef = doc(db, "dynamicFields", fieldId);
    await deleteDoc(fieldRef);
  } catch (error) {
    console.error('Error deleting dynamic field:', error);
    throw new Error('Failed to delete dynamic field');
  }
};
