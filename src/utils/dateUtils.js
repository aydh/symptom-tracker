import { parseISO } from 'date-fns';

/**
 * Parses various timestamp formats into a JavaScript Date object.
 * @param {Date|string|Object} timestamp - The timestamp to parse.
 * @returns {Date|null} The parsed Date object, or null if parsing fails.
 */
export const parseTimestamp = (timestamp) => {
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') return parseISO(timestamp);
  if (timestamp && typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
    // Handle Firestore timestamp cached as JSON
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  }
  console.error('Invalid timestamp format:', timestamp);
  return null;
};
