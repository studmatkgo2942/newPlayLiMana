// src/context/ThemeContext.tsx
import React, {createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo} from 'react';

type Theme = 'light' | 'dark'; // Simplified: only light/dark for now

interface ThemeContextState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextState | undefined>(undefined);

// Helper function to get initial theme
const getInitialTheme = (): Theme => {
    // 1. Check localStorage
    const storedTheme = localStorage.getItem('app-theme') as Theme | null;
    if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
        return storedTheme;
    }
    // 2. Check OS preference (optional default)
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) return 'dark';

    // 3. Default to light
    return 'light';
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(getInitialTheme);

    // Apply theme class to root element and save to localStorage
    useEffect(() => {
        const root = window.document.documentElement; // Get the <html> element
        const isDark = theme === 'dark';

        root.classList.remove(isDark ? 'light' : 'dark');
        root.classList.add(theme);

        try {
            localStorage.setItem('app-theme', theme);
            console.log(`Theme set to ${theme} and saved to localStorage.`);
        } catch (error) {
            console.error("Failed to save theme to localStorage:", error);
        }
    }, [theme]); // Run whenever the theme state changes

    // Function to update theme (used by consumers)
    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
    }, []);

    // Convenience function to toggle theme
    const toggleTheme = useCallback(() => {
        setThemeState(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }, []);

    const value = useMemo(
        () => ({theme, setTheme, toggleTheme}),
        [theme, setTheme, toggleTheme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Custom hook to consume the context
export const useTheme = (): ThemeContextState => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};