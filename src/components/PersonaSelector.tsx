import { Component, createSignal, Show, For } from "solid-js";
import { isServer } from "solid-js/web";

import { Drawer, DrawerContent } from "./ui/drawer";

import type { Persona } from "../lib/gemini";

interface Props {
    isOpen: boolean;
    selectedPersona: Persona;
    onPersonaChange: (persona: Persona) => void;
    onClose?: () => void;
    isLoading?: boolean;
}

export interface PersonaOption {
    id: Persona;
    name: string;
    icon: string;
    description: string;
}

export const personas: PersonaOption[] = [
    {
        id: "default",
        name: "Default",
        icon: "👨‍👩‍👧‍👦",
        description: "Simplified abstract that is accessible to a general audience"
    },
    {
        id: "college",
        name: "College Student",
        icon: "🎓",
        description: "Explained for college students in that field of study"
    },
    {
        id: "kids",
        name: "Kids",
        icon: "🧸",
        description: "Fun, simple explanations for children under 10"
    },
    {
        id: "professional",
        name: "Professional",
        icon: "💻",
        description: "Technical explanation for software engineers."
    },
    {
        id: "researcher",
        name: "Researcher",
        icon: "🔬",
        description: "For researchers in adjacent fields with cross-disciplinary context"
    },
    {
        id: "executive",
        name: "Executive",
        icon: "💼",
        description: "Business-focused with practical applications and impact"
    },
    {
        id: "visual",
        name: "Visual Thinker",
        icon: "🎨",
        description: "Uses visual metaphors and spatial explanations"
    },
];

export const PersonaSelector: Component<Props> = (props) => {
    const [selected, setSelected] = createSignal<Persona>(props.selectedPersona);
    const isMobile = () => !isServer && window.innerWidth < 768;

    const handlePersonaSelect = (persona: Persona) => {
        setSelected(persona);
    };

    const handleApply = () => {
        props.onPersonaChange(selected());
        props.onClose?.();
    };

    const Content = () => (
        <div class="bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col max-h-[85vh]">
            <div class="px-6 pt-8 pb-6">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-2xl font-semibold text-gray-900">Abstract Style</h2>
                    <Show when={isMobile()}>
                        <button 
                            onClick={props.onClose}
                            class="p-2.5 -mr-1.5 hover:bg-black/5 rounded-full transition-colors"
                        >
                            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </Show>
                </div>
                <p class="text-base text-gray-500 font-medium">
                    Choose how you want abstracts to be explained
                </p>
            </div>

            <div class="px-6 pb-6 overflow-y-auto flex-1">
                <div class="space-y-3">
                    <For each={personas}>
                        {(persona) => (
                            <button
                                class={`w-full p-4 rounded-2xl transition-all duration-300
                                       text-left flex items-start gap-4 
                                       ${selected() === persona.id
                                    ? "bg-blue-500/10 shadow-inner border border-blue-500/20"
                                    : "hover:bg-black/5 active:bg-black/10 border border-transparent"
                                }`}
                                onClick={() => handlePersonaSelect(persona.id)}
                                disabled={props.isLoading}
                            >
                                <span class="text-3xl">{persona.icon}</span>
                                <div>
                                    <h3 class={`font-medium text-lg mb-0.5 
                                        ${selected() === persona.id 
                                            ? "text-blue-600" 
                                            : "text-gray-900"}`}>
                                        {persona.name}
                                    </h3>
                                    <p class="text-sm text-gray-500 leading-relaxed">
                                        {persona.description}
                                    </p>
                                </div>
                            </button>
                        )}
                    </For>
                </div>
            </div>

            <div class="p-6 bg-white/80 backdrop-blur-xl border-t border-gray-200/50">
                <button
                    onClick={handleApply}
                    disabled={props.isLoading}
                    class={`w-full h-12 relative ${props.isLoading 
                        ? "bg-blue-400 cursor-not-allowed" 
                        : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transform hover:scale-[1.02] active:scale-[0.98]"
                    } text-white text-base font-medium rounded-2xl transition-all
                    duration-300 shadow-lg shadow-blue-500/25`}
                >
                    <Show when={props.isLoading} fallback="Apply Changes">
                        <div class="absolute inset-0 flex items-center justify-center">
                            <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span>Applying...</span>
                        </div>
                    </Show>
                </button>
            </div>
        </div>
    );

    return (
        <Show when={props.isOpen}>
            {isMobile() ? (
                <Drawer open={props.isOpen} onOpenChange={props.onClose}>
                    <DrawerContent class="p-0 rounded-t-[2rem] shadow-2xl">
                        <Content />
                    </DrawerContent>
                </Drawer>
            ) : (
                <div
                    class="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
                    onClick={props.onClose}
                >
                    <div
                        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                               w-[90%] max-w-lg shadow-2xl shadow-black/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Content />
                    </div>
                </div>
            )}
        </Show>
    );
}; 