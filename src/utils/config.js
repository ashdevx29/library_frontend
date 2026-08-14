/**
 * Dynamic API & Socket URL Configurator.
 * Automatically resolves local vs live server URLs based on current domain.
 */
export const getApiConfig = () => {
  const LIVE_API = 'https://library-backend-production-6fbf.up.railway.app/api';
  const LIVE_SOCKET = 'https://library-backend-production-6fbf.up.railway.app';
  const LOCAL_API = 'http://localhost:5000/api';
  const LOCAL_SOCKET = 'http://localhost:5000';

  const envApi = import.meta.env.VITE_API_URL;
  const envSocket = import.meta.env.VITE_SOCKET_URL;

  const isLocalHost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.')
  );

  let apiUrl;
  let socketUrl;

  if (isLocalHost) {
    apiUrl = envApi || LOCAL_API;
    socketUrl = envSocket || LOCAL_SOCKET;
  } else {
    apiUrl = (envApi && !envApi.includes('localhost')) ? envApi : LIVE_API;
    socketUrl = (envSocket && !envSocket.includes('localhost')) ? envSocket : LIVE_SOCKET;
  }

  const apiBase = apiUrl.replace(/\/api$/, '');

  return {
    apiUrl,
    socketUrl,
    apiBase,
    isLocalHost,
  };
};

export const API_URL = getApiConfig().apiUrl;
export const SOCKET_URL = getApiConfig().socketUrl;
export const API_BASE = getApiConfig().apiBase;
