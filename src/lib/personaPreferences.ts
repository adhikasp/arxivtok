import { createSignal, createRoot, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import type { Persona } from "./gemini";

const STORAGE_KEY = "arxivtok_persona_preference";

// Function to load the saved persona preference from localStorage
export function loadPersonaPreference(): Persona {
  if (isServer || typeof localStorage === 'undefined') return "default";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? (JSON.parse(stored) as Persona) : "default";
}

// Function to save the persona preference to localStorage
export function savePersonaPreference(persona: Persona): void {
  if (isServer || typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persona));
  // Dispatch a storage event to notify other tabs/windows
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEY,
    newValue: JSON.stringify(persona)
  }));
}

// Track if the module has been initialized
let isInitialized = false;

// Create a root-level signal for the selected persona
export const [selectedPersona, setSelectedPersona] = createRoot(() => {
  // Always start with default on the server to ensure hydration matching
  const [persona, setPersona] = createSignal<Persona>("default");

  if (!isServer) {
    onMount(() => {
      if (!isInitialized) {
        // Only load from localStorage after initial render on client
        setTimeout(() => {
          const stored = loadPersonaPreference();
          setPersona(stored);
          isInitialized = true;
        }, 0);
      }
    });
  }

  return [persona, setPersona];
});

// Hook to use persona preferences with automatic persistence
export function usePersonaPreference() {
  // Don't initialize on server or if already initialized
  if (!isServer && !isInitialized) {
    // Delay loading from localStorage to avoid hydration mismatch
    onMount(() => {
      setTimeout(() => {
        const stored = loadPersonaPreference();
        setSelectedPersona(stored);
        isInitialized = true;
      }, 0);
    });
  }

  // Function to update the persona preference
  const updatePersona = (persona: Persona) => {
    setSelectedPersona(persona);
    if (!isServer) {
      savePersonaPreference(persona);
    }
  };

  // Set up storage event listener to sync across tabs
  onMount(() => {
    if (isServer) return;
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setSelectedPersona(JSON.parse(e.newValue) as Persona);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  });

  return {
    selectedPersona,
    updatePersona
  };
} 