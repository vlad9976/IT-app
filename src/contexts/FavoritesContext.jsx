import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'script-generator-favorites';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Could not save favorites:', e);
    }
  }, [favorites]);

  const toggleFavorite = (scriptId) => {
    setFavorites((prev) => {
      if (prev.includes(scriptId)) {
        return prev.filter((id) => id !== scriptId);
      }
      return [...prev, scriptId];
    });
  };

  const isFavorite = (scriptId) => favorites.includes(scriptId);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return ctx;
}
