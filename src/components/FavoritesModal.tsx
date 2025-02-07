import { Component, createSignal, For, Show } from "solid-js";
import { useFavorites } from "@/lib/favorites";
import { Paper } from "@/lib/papers";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelectPaper: (paper: Paper) => void;
}

export const FavoritesModal: Component<Props> = (props) => {
    const { favorites } = useFavorites();
    const [searchQuery, setSearchQuery] = createSignal("");

    const filteredFavorites = () => {
        const query = searchQuery().toLowerCase();
        return favorites().filter(f => 
            f.paper.title.toLowerCase().includes(query) ||
            f.paper.summary.toLowerCase().includes(query) ||
            f.paper.authors.some(author => author.toLowerCase().includes(query))
        ).sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    };

    // Prevenir que el scroll se propague al componente padre
    const handleScroll = (e: WheelEvent) => {
        e.stopPropagation();
    };

    return (
        <Show when={props.isOpen}>
            <div 
                class="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                onClick={props.onClose}
                onWheel={handleScroll}
            >
                <div 
                    class="absolute top-[15vh] left-1/2 -translate-x-1/2 w-[90%] max-w-2xl max-h-[70vh] 
                           bg-white rounded-2xl shadow-xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div class="p-4 border-b border-gray-200">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-lg font-semibold text-gray-900">Your Favorites</h2>
                            <button 
                                onClick={props.onClose}
                                class="text-gray-400 hover:text-gray-500"
                            >
                                <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                                </svg>
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Search your favorites..."
                            value={searchQuery()}
                            onInput={(e) => setSearchQuery(e.currentTarget.value)}
                            class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 
                                   focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                    </div>

                    <div 
                        class="overflow-y-auto overscroll-contain" 
                        style="max-height: calc(70vh - 120px);"
                        onWheel={handleScroll}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                    >
                        <For each={filteredFavorites()} fallback={
                            <div class="p-8 text-center text-gray-500">
                                {favorites().length === 0 ? "No favorites yet" : "No matches found"}
                            </div>
                        }>
                            {(favorite) => (
                                <button
                                    onClick={() => props.onSelectPaper(favorite.paper)}
                                    class="w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 
                                           transition-colors duration-150"
                                >
                                    <h3 class="font-medium text-gray-900 mb-1 line-clamp-2">
                                        {favorite.paper.title}
                                    </h3>
                                    <p class="text-sm text-gray-500 mb-2">
                                        {new Date(favorite.addedAt).toLocaleDateString()}
                                    </p>
                                    <p class="text-sm text-gray-600 line-clamp-2">
                                        {favorite.paper.summary}
                                    </p>
                                </button>
                            )}
                        </For>
                    </div>
                </div>
            </div>
        </Show>
    );
};
