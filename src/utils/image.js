import { API_BASE } from '../store/themeStore';

/**
 * Returns a fully resolved photo URL.
 * Handles relative paths starting with /uploads, absolute URLs, and UI avatars fallback.
 *
 * @param {string} path - The photo path or URL stored in database.
 * @param {string} [name='User'] - Fallback display name for generating ui-avatars URL.
 * @returns {string} Fully resolved photo image URL.
 */
export const getPhotoUrl = (path, name = 'User') => {
  if (!path || typeof path !== 'string' || path.trim() === '') {
    return `https://ui-avatars.com/api/?background=FFF0E6&color=FF6B00&name=${encodeURIComponent(name)}&size=128`;
  }

  const cleanPath = path.trim();

  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:')) {
    return cleanPath;
  }

  if (cleanPath.startsWith('/uploads')) {
    return `${API_BASE}${cleanPath}`;
  }

  return `${API_BASE}/${cleanPath.replace(/^\/+/, '')}`;
};
