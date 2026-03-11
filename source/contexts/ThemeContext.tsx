import React, { createContext, useContext } from 'react';
import { Theme, themes, defaultThemeName } from '../constants/themes.js';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (name: string) => void;
}>({
  theme: themes[defaultThemeName]!,
  setTheme: () => {},
});

interface ThemeProviderProps {
  theme: Theme;
  setTheme: (name: string) => void;
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ theme, setTheme, children }) => {
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  return useContext(ThemeContext);
}
