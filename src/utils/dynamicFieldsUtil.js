import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const fetchDynamicFields = async () => {
  try {
    const fieldsSnapshot = await getDocs(collection(db, 'dynamicFields'));
    const fields = fieldsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort fields based on the order attribute
    const sortedFields = fields.sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : parseInt(a.order) || 0;
      const orderB = typeof b.order === 'number' ? b.order : parseInt(b.order) || 0;
      return orderA - orderB;
    });
    
    return sortedFields;
  } catch (err) {
    console.error('Error fetching dynamic fields:', err);
    throw err;
  }
};
