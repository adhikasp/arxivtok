import { Component, createSignal, Show } from "solid-js";

interface TutorialOverlayProps {
    onDismiss?: () => void;
}

const TUTORIAL_KEY = 'arxivtok_tutorial_shown';

const isTutorialShown = () => {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem(TUTORIAL_KEY));
};

export const TutorialOverlay: Component<TutorialOverlayProps> = (props) => {
    const [show, setShow] = createSignal(!isTutorialShown());

    const dismissTutorial = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(TUTORIAL_KEY, 'true');
        }
        setShow(false);
        props.onDismiss?.();
    };

    return (
        <Show when={show()}>
            <div 
                class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm 
                       flex items-center justify-center animate-fade-in"
                onClick={dismissTutorial}
            >
                <div class="flex flex-col items-center gap-8">
                    <div class="relative w-32 h-32 animate-pulse">
                        <div class="absolute inset-0 animate-ping-slow">
                            <svg class="w-full h-full text-white/80" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M8 16a2 2 0 0 1-2-2v-2h2v2h2v2H8zm2-12v2H8v2H6V6a2 2 0 0 1 2-2h2zm6 10v2h-2v-2h-2v-2h2v2h2zm-2-8h-2V4h2a2 2 0 0 1 2 2v2h-2V6z"/>
                            </svg>
                        </div>
                        <div class="absolute inset-0">
                            <svg class="w-full h-full text-white" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M8 16a2 2 0 0 1-2-2v-2h2v2h2v2H8zm2-12v2H8v2H6V6a2 2 0 0 1 2-2h2zm6 10v2h-2v-2h-2v-2h2v2h2zm-2-8h-2V4h2a2 2 0 0 1 2 2v2h-2V6z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="text-center space-y-2">
                        <p class="text-white text-xl font-medium">Double tap to favorite</p>
                        <p class="text-white/80 text-sm">Tap anywhere to dismiss</p>
                    </div>
                </div>
            </div>
        </Show>
    );
};
