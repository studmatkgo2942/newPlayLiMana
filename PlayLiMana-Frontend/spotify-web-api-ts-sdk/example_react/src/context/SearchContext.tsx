// src/context/SearchContext.tsx
import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    Dispatch,
    SetStateAction,
    useEffect,
    useCallback // Import useCallback
} from 'react';


import type { SearchResultDisplayItem } from '../components/features/music/MainPageSpotify.tsx';
import { Artist, Track, SimplifiedAlbum } from "@spotify/web-api-ts-sdk";
import {useSpotifyContext} from "./SpotifyContext.tsx";

// Define the shape of the context data provided to consumers
interface SearchContextState {
    searchTerm: string;
    setSearchTerm: Dispatch<SetStateAction<string>>;
    currentResults: SearchResultDisplayItem[]; // Results for the current searchTerm
    isLoading: boolean;
    error: string | null;
}

// Create the context
const SearchContext = createContext<SearchContextState | undefined>(undefined);


// --- Helper Hooks ---
// Debounce Hook (remains the same)
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

const DEBOUNCE_DELAY = 500;

// --- Provider Component ---
export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    // Cache stores results keyed by search term (Map<term, results>)
    const [cachedResults, setCachedResults] = useState<Map<string, SearchResultDisplayItem[]>>(new Map());
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const {sdk} = useSpotifyContext();// Get SDK instance via context hook

    // Debounce the user's input search term
    const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);


    // Wrapped in useCallback for stability, depends only on SDK and setters
    const performSearch = useCallback(async (term: string) => {
        const trimmedTerm = term.trim();
        if (!sdk || !trimmedTerm) {
            setError(null); setIsLoading(false); // Clear status if the term is empty or no SDK
            return;
        }

        // 1. Check Cache First
        if (cachedResults.has(trimmedTerm)) {
            console.log(`SearchContext: Cache hit for '${trimmedTerm}'.`);
            setError(null);
            setIsLoading(false); // Already have data, not loading
            return; // Exit - results are already available via derived state below
        }

        // 2. Not in Cache - Perform API Call
        console.log(`SearchContext: Cache miss. Performing API search for '${trimmedTerm}'`);
        setIsLoading(true); // Set loading TRUE only before API call
        setError(null);

        try {
            const searchTypes: ('artist' | 'track' | 'album')[] = ['artist', 'track', 'album'];
            const limit = 15;
            const response = await sdk.search(trimmedTerm, searchTypes,undefined, limit );
            console.log(`SearchContext: API response received for '${trimmedTerm}'`);
            const combinedResults: SearchResultDisplayItem[] = [];

            // Process results (same mapping logic as before)
            response.artists?.items.forEach((artist: Artist) => combinedResults.push({ id: artist.id, title: artist.name, type: 'Artist', imageUrl: artist.images?.[0]?.url, externalUrl: artist.external_urls?.spotify, uri: artist.uri }));
            response.tracks?.items.forEach((track: Track) => { combinedResults.push({ id: track.id, title: `${track.name} - ${track.artists.map(a => a.name).join(', ')}`, type: 'Track', imageUrl: track.album.images?.[0]?.url, externalUrl: track.external_urls?.spotify, previewUrl: track.preview_url || undefined, uri: track.uri }); });
            response.albums?.items.forEach((album: SimplifiedAlbum) => combinedResults.push({ id: album.id, title: `${album.name} - ${album.artists.map(a => a.name).join(', ')}`, type: 'Album', imageUrl: album.images?.[0]?.url, externalUrl: album.external_urls?.spotify, uri: album.uri }));

            // Add results to the cache state (using functional update)
            setCachedResults(prevCache => new Map(prevCache).set(trimmedTerm, combinedResults));

        } catch (err: any) {
            console.error(`SearchContext: Spotify Search failed for '${trimmedTerm}':`, err);
            setError(`Search failed: ${err.message || 'Unknown error'}`);
            // Clear potentially bad cache entry on error
            setCachedResults(prevCache => {
                const newCache = new Map(prevCache);
                newCache.delete(trimmedTerm);
                return newCache;
            });
        } finally {
            setIsLoading(false);
        }
    }, [sdk, setCachedResults, setIsLoading, setError]);


    // --- Effect to Automatically Trigger Search on Debounced Term Change ---
    useEffect(() => {
        const term = debouncedSearchTerm.trim();
        console.log("SearchContext: Debounced term changed to:", term);
        if (term) {
            // Call performSearch - it will handle cache checking internally
            performSearch(term);
        } else {
            // Clear status immediately if the debounced term is empty
            setIsLoading(false);
            setError(null);
        }
        // performSearch is memoized by useCallback
    }, [debouncedSearchTerm, performSearch]);


    // --- Derive results for the *instant* searchTerm from cache ---
    // This ensures the UI updates immediately if the user types a term already in cache
    const currentResults = cachedResults.get(searchTerm.trim()) || [];

    // --- Context Value ---
    // Expose only the necessary values for consumers
    const value = {
        searchTerm,
        setSearchTerm,
        currentResults,
        isLoading,
        error,
        setError
    };

    return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

// --- Consumer Hook ---
export const useSearch = (): SearchContextState => {
    const context = useContext(SearchContext);
    if (context === undefined) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
};