import { createSignal, createRoot, onMount } from "solid-js";

import type { Paper } from "./papers";

const STORAGE_KEY = "arxivtok_favorites";

interface StoredFavorite {
    id: string;
    paper: Paper;
    addedAt: string;
}

export function loadFavorites(): StoredFavorite[] {
    if (typeof localStorage === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

export function saveFavorites(favorites: StoredFavorite[]) {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        window.dispatchEvent(new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: JSON.stringify(favorites)
        }));
    }
}

let isInitialized = false;

export const [favorites, setFavorites] = createRoot(() => {
    const [favs, setFavs] = createSignal<StoredFavorite[]>([]);

    if (typeof window !== 'undefined') {
        onMount(() => {
            if (!isInitialized) {
                const stored = loadFavorites();
                setFavs(stored);
                isInitialized = true;
            }
        });
    }

    return [favs, setFavs];
});

export function useFavorites() {
    if (typeof window !== 'undefined' && !isInitialized) {
        const stored = loadFavorites();
        setFavorites(stored);
        isInitialized = true;
    }

    const addFavorite = (paper: Paper) => {
        const newFavorite: StoredFavorite = {
            id: paper.id,
            paper,
            addedAt: new Date().toISOString()
        };
        setFavorites(prev => {
            const updated = prev.find(f => f.id === paper.id) 
                ? prev 
                : [...prev, newFavorite];
            saveFavorites(updated);
            return updated;
        });
    };

    const removeFavorite = (paperId: string) => {
        setFavorites(prev => {
            const updated = prev.filter(f => f.id !== paperId);
            saveFavorites(updated);
            return updated;
        });
    };

    const isFavorite = (paperId: string) => {
        return favorites().some(f => f.id === paperId);
    };

    onMount(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) {
                setFavorites(loadFavorites());
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    });

    return {
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite
    };
}
