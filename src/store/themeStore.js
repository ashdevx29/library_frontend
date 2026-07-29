import { create } from 'zustand';
import { fetchTheme, saveTheme } from '../services/themeService';

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';

const defaultTheme = {
  libraryName: 'Saahityik Library ERP',
  logo: '/logo.png',
  favicon: '/favicon.ico',
  primaryColor: '#FF6B00',
  secondaryColor: '#FFA000',
  accentColor: '#FFB800',
  sidebarColor: '#0f172a',
  headerColor: '#ffffff',
  buttonColor: '#FF6B00',
  fontFamily: 'Poppins, sans-serif',
};

const applyCssVars = (theme) => {
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primaryColor);
  root.style.setProperty('--secondary', theme.secondaryColor);
  root.style.setProperty('--accent', theme.accentColor);
  root.style.setProperty('--sidebar', theme.sidebarColor);
  root.style.setProperty('--header', theme.headerColor);
  root.style.setProperty('--button', theme.buttonColor);
  root.style.setProperty('--font-family', theme.fontFamily);
  document.body.style.fontFamily = theme.fontFamily;

  if (theme.favicon) {
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = theme.favicon.startsWith('http') || theme.favicon.startsWith('/')
      ? (theme.favicon.startsWith('/uploads') ? `${API_BASE}${theme.favicon}` : theme.favicon)
      : theme.favicon;
  }

  if (theme.libraryName) {
    document.title = theme.libraryName;
  }
};

const useThemeStore = create((set, get) => ({
  theme: JSON.parse(localStorage.getItem('appTheme')) || defaultTheme,
  loading: false,
  saving: false,
  error: null,

  loadTheme: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchTheme();
      const theme = { ...defaultTheme, ...data };
      localStorage.setItem('appTheme', JSON.stringify(theme));
      applyCssVars(theme);
      set({ theme, loading: false });
    } catch (e) {
      applyCssVars(get().theme);
      set({ loading: false, error: e.response?.data?.message || 'Could not load theme' });
    }
  },

  setThemeLocal: (partial) => {
    const theme = { ...get().theme, ...partial };
    localStorage.setItem('appTheme', JSON.stringify(theme));
    applyCssVars(theme);
    set({ theme });
  },

  persistTheme: async (partial) => {
    const payload = { ...get().theme, ...partial };
    set({ saving: true, error: null, theme: payload });
    applyCssVars(payload);
    try {
      const data = await saveTheme(payload);
      const theme = { ...defaultTheme, ...data };
      localStorage.setItem('appTheme', JSON.stringify(theme));
      applyCssVars(theme);
      set({ theme, saving: false });
      return theme;
    } catch (e) {
      set({ saving: false, error: e.response?.data?.message || 'Could not save theme' });
      throw e;
    }
  },
}));

export default useThemeStore;
export { API_BASE, applyCssVars, defaultTheme };
