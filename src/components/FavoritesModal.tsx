import { Component, createSignal, For, Show } from "solid-js";

import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useFavorites } from "@/lib/favorites";
import { Paper } from "@/lib/papers";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelectPaper: (paper: Paper) => void;
}

export const FavoritesModal: Component<Props> = (props) => {
    const { favorites, removeFavorite } = useFavorites();
    const [searchQuery, setSearchQuery] = createSignal("");
    const [showDeleteConfirm, setShowDeleteConfirm] = createSignal<string | null>(null);
    const isMobile = () => window.innerWidth < 768;

    const filteredFavorites = () => {
        const query = searchQuery().toLowerCase();
        return favorites().filter(f => 
            f.paper.title.toLowerCase().includes(query) ||
            f.paper.summary.toLowerCase().includes(query) ||
            f.paper.authors.some(author => author.toLowerCase().includes(query))
        ).sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    };

    const handleRemoveFavorite = (paperId: string) => {
        setShowDeleteConfirm(paperId);
    };

    const confirmRemove = (paperId: string) => {
        removeFavorite(paperId);
        setShowDeleteConfirm(null);
    };

    // Prevenir que el scroll se propague al componente padre
    const handleScroll = (e: WheelEvent) => {
        e.stopPropagation();
    };

    const DesktopModal = () => (
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
                <HeaderContent />
                <ListContent />
            </div>
        </div>
    );

    const MobileDrawer = () => (
        <Drawer open={props.isOpen} onOpenChange={props.onClose}>
            <DrawerContent class="p-0 rounded-t-2xl">
                <div class="max-h-[85vh] flex flex-col">
                    <HeaderContent />
                    <ListContent />
                </div>
            </DrawerContent>
        </Drawer>
    );

    const HeaderContent = () => (
        <div class="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-gray-900">Your Favorites</h2>
                <button 
                    onClick={props.onClose}
                    class="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <svg class="w-5 h-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                    </svg>
                </button>
            </div>
            <div class="relative">
                <input
                    type="text"
                    placeholder="Search your favorites..."
                    value={searchQuery()}
                    onInput={(e) => setSearchQuery(e.currentTarget.value)}
                    class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <svg 
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        </div>
    );

    const ListContent = () => (
        <div 
            class="overflow-y-auto overscroll-contain flex-1"
            onWheel={handleScroll}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
        >
            <For each={filteredFavorites()} fallback={
                <div class="p-8 text-center text-gray-500">
                    {favorites().length === 0 ? 
                        <div class="flex flex-col items-center gap-4">
                            <svg class="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <p>Double tap any paper to add it to favorites</p>
                        </div>
                        : "No matches found"}
                </div>
            }>
                {(favorite) => (
                    <div class="relative group border-b border-gray-100 last:border-0">
                        <button
                            onClick={() => props.onSelectPaper(favorite.paper)}
                            class="w-full p-4 text-left hover:bg-gray-50/80 
                                   transition-colors duration-150"
                        >
                            <h3 class="font-medium text-gray-900 mb-1 line-clamp-2 pr-12">
                                {favorite.paper.title}
                            </h3>
                            <p class="text-sm text-gray-500 mb-2">
                                {new Date(favorite.addedAt).toLocaleDateString()}
                            </p>
                            <p class="text-sm text-gray-600 line-clamp-2">
                                {favorite.paper.summary}
                            </p>
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFavorite(favorite.paper.id);
                            }}
                            class="absolute top-4 right-4 p-2 md:opacity-0 md:group-hover:opacity-100
                                   bg-white rounded-full hover:bg-red-50 transition-all duration-200"
                        >
                            <svg class="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>

                        <Show when={showDeleteConfirm() === favorite.paper.id}>
                            <div class="absolute inset-0 bg-white/95 backdrop-blur-sm 
                                        flex items-center justify-center">
                                <div class="text-center px-4">
                                    <p class="text-sm text-gray-600 mb-3">
                                        Remove this paper from favorites?
                                    </p>
                                    <div class="flex justify-center gap-2">
                                        <button
                                            onClick={() => confirmRemove(favorite.paper.id)}
                                            class="px-4 py-2 text-sm font-medium text-white bg-red-500 
                                                   rounded-lg hover:bg-red-600 transition-colors"
                                        >
                                            Remove
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteConfirm(null)}
                                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 
                                                   rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Show>
                    </div>
                )}
            </For>
        </div>
    );

    return (
        <Show when={props.isOpen}>
            {isMobile() ? <MobileDrawer /> : <DesktopModal />}
        </Show>
    );
};
