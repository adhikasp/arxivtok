import { createSignal, createRoot, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import type { Persona } from "./gemini";

const STORAGE_KEY = "arxivtok_persona_preference";

// Function to load the saved persona preference from localStorage
export function loadPersonaPreference(): Persona {
  if (isServer || typeof localStorage === 'undefined') return "default";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Persona) : "default";
  } catch (e) {
    console.error("Error loading persona preference:", e);
    return "default";
  }
}

// Function to save the persona preference to localStorage
export function savePersonaPreference(persona: Persona): void {
  if (isServer || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persona));
    // Dispatch a storage event to notify other tabs/windows
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: JSON.stringify(persona)
    }));
  } catch (e) {
    console.error("Error saving persona preference:", e);
  }
}

// Track if the module has been initialized
let isInitialized = false;
let hydrationComplete = false;

// Get the initial persona value from localStorage if we're on the client
const getInitialPersona = (): Persona => {
  if (isServer || typeof localStorage === 'undefined') return "default";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Persona) : "default";
  } catch (e) {
    console.error("Error loading initial persona preference:", e);
    return "default";
  }
};

// Create a root-level signal for the selected persona
export const [selectedPersona, setSelectedPersona] = createRoot(() => {
  // Initialize with the stored value if on client, otherwise default
  const initialValue = isServer ? "default" : getInitialPersona();
  const [persona, setPersona] = createSignal<Persona>(initialValue);

  if (!isServer) {
    // Mark hydration as complete after a short delay
    setTimeout(() => {
      hydrationComplete = true;
      
      // Ensure we're using the stored value after hydration
      if (!isInitialized) {
        const stored = loadPersonaPreference();
        setPersona(stored);
        isInitialized = true;
      }
    }, 100);
  }

  return [persona, setPersona];
});

// Hook to use persona preferences with automatic persistence
export function usePersonaPreference() {
  // Only initialize on client and after hydration if not already initialized
  if (!isServer && !isInitialized) {
    onMount(() => {
      // Wait for hydration to complete
      const checkHydration = () => {
        if (hydrationComplete) {
          const stored = loadPersonaPreference();
          setSelectedPersona(stored);
          isInitialized = true;
        } else {
          setTimeout(checkHydration, 50);
        }
      };
      
      setTimeout(checkHydration, 50);
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
        try {
          setSelectedPersona(JSON.parse(e.newValue) as Persona);
        } catch (err) {
          console.error("Error parsing persona from storage event:", err);
        }
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