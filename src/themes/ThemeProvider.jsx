import React, { useEffect } from 'react';
import useThemeStore from '../store/themeStore';

const ThemeProvider = ({ children }) => {
  const { theme, loadTheme } = useThemeStore();

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primaryColor);
    root.style.setProperty('--secondary', theme.secondaryColor);
    root.style.setProperty('--accent', theme.accentColor);
    root.style.setProperty('--sidebar', theme.sidebarColor);
    root.style.setProperty('--header', theme.headerColor);
    root.style.setProperty('--button', theme.buttonColor);
    root.style.setProperty('--font-family', theme.fontFamily);
    document.body.style.fontFamily = theme.fontFamily;
  }, [theme]);

  return <>{children}</>;
};

export default ThemeProvider;
