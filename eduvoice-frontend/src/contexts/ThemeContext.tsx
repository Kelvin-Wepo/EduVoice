import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface ThemeContextType {
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  reducedMotion: boolean;
  toggleHighContrast: () => void;
  setFontSize: (size: 'small' | 'medium' | 'large' | 'extra-large') => void;
  toggleReducedMotion: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large' | 'extra-large'>(
    'medium'
  );
  const [reducedMotion, setReducedMotion] = useState(false);

  // Load preferences from user or localStorage
  useEffect(() => {
    if (user) {
      setHighContrast(user.high_contrast_mode);
      setFontSizeState(user.font_size);
      setReducedMotion(user.reduced_motion);
    } else {
      // Load from localStorage if not logged in
      const savedHighContrast = localStorage.getItem('high_contrast') === 'true';
      const savedFontSize = localStorage.getItem('font_size') as any;
      const savedReducedMotion = localStorage.getItem('reduced_motion') === 'true';

      setHighContrast(savedHighContrast);
      setFontSizeState(savedFontSize || 'medium');
      setReducedMotion(savedReducedMotion);
    }
  }, [user]);

  // Apply theme changes to document
  useEffect(() => {
    const body = document.body;

    // High contrast
    if (highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }

    // Font size
    body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-extra-large');
    body.classList.add(`font-size-${fontSize}`);

    // Reduced motion
    if (reducedMotion) {
      body.classList.add('reduced-motion');
    } else {
      body.classList.remove('reduced-motion');
    }

    // Save to localStorage
    localStorage.setItem('high_contrast', highContrast.toString());
    localStorage.setItem('font_size', fontSize);
    localStorage.setItem('reduced_motion', reducedMotion.toString());
  }, [highContrast, fontSize, reducedMotion]);

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  const setFontSize = (size: 'small' | 'medium' | 'large' | 'extra-large') => {
    setFontSizeState(size);
  };

  const toggleReducedMotion = () => {
    setReducedMotion(prev => !prev);
  };

  const value: ThemeContextType = {
    highContrast,
    fontSize,
    reducedMotion,
    toggleHighContrast,
    setFontSize,
    toggleReducedMotion,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
