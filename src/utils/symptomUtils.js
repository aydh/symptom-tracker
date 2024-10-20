import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';

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
    const symptomsRef = collection(db, "symptoms");
    const q = query(
      symptomsRef,
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp)
      };
    });
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
    const symptomsRef = collection(db, "symptoms");
    const newSymptomRef = await addDoc(symptomsRef, {
      ...symptomData,
      userId,
      timestamp: serverTimestamp()
    });

    return newSymptomRef.id;
  } catch (error) {
    console.error('Error adding symptom entry:', error);
    throw new Error('Failed to add symptom entry');
  }
};

// Add more utility functions as needed, e.g., updateSymptomEntry, deleteSymptomEntry, etc.
