import { Component, createSignal, For, Show } from "solid-js";

import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Source } from "@/lib/papers";

interface Props {
    selectedSources: Source[];
    onSourcesChange: (sources: Source[]) => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const sources: { id: Source; name: string; description: string; icon: string }[] = [
    {
        id: "arxiv",
        name: "arXiv",
        description: "Latest research papers from Computer Science, Physics, and more",
        icon: "🔬",
    },
    {
        id: "medrxiv",
        name: "medRxiv",
        description: "Preprints in Health Sciences and Medicine",
        icon: "🏥",
    },
    {
        id: "biorxiv",
        name: "bioRxiv",
        description: "Preprints in Life Sciences",
        icon: "🧬",
    },
    {
        id: "pubmed",
        name: "PubMed",
        description: "Peer-reviewed medical and life sciences literature",
        icon: "📚",
    },
    {
        id: "hackernews",
        name: "Hacker News",
        description: "Tech news and discussions from the HN community",
        icon: "💻",
    },
];

export const SourceMixer: Component<Props> = (props) => {
    const [selected, setSelected] = createSignal<Source[]>(props.selectedSources);
    const isMobile = () => window.innerWidth < 768;

    const toggleSource = (source: Source) => {
        const current = selected();
        if (current.includes(source)) {
            // Asegurarse de que al menos una fuente queda seleccionada
            if (current.length > 1) {
                setSelected(current.filter((s) => s !== source));
            }
        } else {
            setSelected([...current, source]);
        }
    };

    const handleApply = () => {
        props.onSourcesChange(selected());
        props.onClose?.();
    };

    const Content = () => (
        <div class="bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col max-h-[85vh]">
            <div class="px-6 pt-8 pb-6">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-2xl font-semibold text-gray-900">Mix Sources</h2>
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
                    Choose your preferred research sources
                </p>
            </div>

            <div class="px-6 pb-6 overflow-y-auto flex-1">
                <div class="space-y-3">
                    <For each={sources}>
                        {(source) => (
                            <button
                                class={`w-full p-4 rounded-2xl transition-all duration-300
                                       text-left flex items-start gap-4 
                                       ${selected().includes(source.id)
                                    ? "bg-blue-500/10 shadow-inner border border-blue-500/20"
                                    : "hover:bg-black/5 active:bg-black/10 border border-transparent"
                                }`}
                                onClick={() => toggleSource(source.id)}
                            >
                                <span class="text-3xl">{source.icon}</span>
                                <div>
                                    <h3 class={`font-medium text-lg mb-0.5 
                                        ${selected().includes(source.id) 
                                            ? "text-blue-600" 
                                            : "text-gray-900"}`}>
                                        {source.name}
                                    </h3>
                                    <p class="text-sm text-gray-500 leading-relaxed">
                                        {source.description}
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
                    class="w-full h-12 bg-blue-500 hover:bg-blue-600 active:bg-blue-700
                           text-white text-base font-medium rounded-2xl transition-all
                           duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                           shadow-lg shadow-blue-500/25"
                >
                    Apply Changes
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
