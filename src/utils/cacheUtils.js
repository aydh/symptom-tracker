// src/utils/cacheUtils.js

export const clearCache = async () => {
  try {
    // Clear browser caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // Clear local storage
    localStorage.clear();

    // Clear session storage
    sessionStorage.clear();

    console.log('Cache cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
};
