import { createSignal, onMount, For, createEffect, Show } from "solid-js";
import { fetchArxivPapers } from "@/lib/arxiv";
import { PaperCard } from "@/components/PaperCard";
import { SearchBar } from "@/components/SearchBar";

export default function Home() {
    const [papers, setPapers] = createSignal<any[]>([]);
    const [currentIndex, setCurrentIndex] = createSignal(0);
    const [page, setPage] = createSignal(0);
    const [isLoading, setIsLoading] = createSignal(false);
    const [searchQuery, setSearchQuery] = createSignal("");
    const [touchStart, setTouchStart] = createSignal(0);
    const [touchEnd, setTouchEnd] = createSignal(0);
    const minSwipeDistance = 50;

    const loadPapers = async (reset = false) => {
        if (isLoading()) return;
        setIsLoading(true);
        try {
            const newPapers = await fetchArxivPapers({ 
                page: reset ? 0 : page(), 
                perPage: 5,
                query: searchQuery()
            });
            setPapers(reset ? newPapers : [...papers(), ...newPapers]);
            setPage(reset ? 1 : page() + 1);
            if (reset) setCurrentIndex(0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        loadPapers(true);
    };

    const handleScroll = (e: WheelEvent) => {
        if (isLoading()) return;
        
        if (e.deltaY > 0 && currentIndex() < papers().length - 1) {
            setCurrentIndex(i => i + 1);
        } else if (e.deltaY < 0 && currentIndex() > 0) {
            setCurrentIndex(i => i - 1);
        }

        if (currentIndex() >= papers().length - 2) {
            loadPapers();
        }
    };

    const handleTouchStart = (e: TouchEvent) => {
        if (currentIndex() === 0 && touchStart() === 0) {
            e.preventDefault();
        }
        setTouchStart(e.changedTouches[0].screenY);
    };

    const handleTouchMove = (e: TouchEvent) => {
        setTouchEnd(e.changedTouches[0].screenY);
        if (currentIndex() === 0 && touchEnd() > touchStart()) {
            e.preventDefault();
        }
    };

    const handleTouchEnd = () => {
        if (!isLoading()) {
            const swipeDistance = touchStart() - touchEnd();
            
            if (Math.abs(swipeDistance) > minSwipeDistance) {
                if (swipeDistance > 0 && currentIndex() < papers().length - 1) {
                    setCurrentIndex(i => i + 1);
                } else if (swipeDistance < 0 && currentIndex() > 0) {
                    setCurrentIndex(i => i - 1);
                }
            }

            if (currentIndex() >= papers().length - 2) {
                loadPapers();
            }
        }
    };

    onMount(() => {
        loadPapers();
        window.addEventListener('wheel', handleScroll, { passive: true });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener('wheel', handleScroll);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    });

    return (
        <main
            class="h-screen w-screen overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 touch-none overscroll-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div class="fixed top-0 left-0 right-0 z-50 h-16 px-6 bg-gradient-to-b from-white/80 to-transparent backdrop-blur-sm">
                <div class="max-w-7xl mx-auto h-full flex items-center">
                    <div class="flex items-center space-x-4 h-full">
                        <div class="flex-shrink-0">
                            <div>
                                <h1 class="text-2xl font-bold tracking-tight">
                                    <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                                        ArXiv
                                    </span>
                                    <span class="text-gray-900">Tok</span>
                                </h1>
                                <p class="text-sm text-gray-500 mt-1">
                                    Discover research, swipe by swipe
                                </p>
                            </div>
                        </div>

                        <Show when={searchQuery()}>
                            <div class="flex items-center pl-4 border-l border-gray-200">
                                <span class="text-xs text-gray-400 mr-2">
                                    Filtering:
                                </span>
                                <div class="flex items-center bg-blue-50 px-2 py-1 rounded-md">
                                    <span class="text-sm text-blue-700 font-medium truncate max-w-[150px]">
                                        {searchQuery()}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setSearchQuery("");
                                            loadPapers(true);
                                        }}
                                        class="ml-2 text-blue-400 hover:text-blue-600"
                                    >
                                        <svg
                                            class="w-3 h-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </Show>
                    </div>
                </div>
            </div>

            <SearchBar onSearch={handleSearch} />

            <div class="relative h-full w-full">
                <For each={papers()}>
                    {(paper, index) => (
                        <div
                            class="absolute w-full h-full transition-transform duration-500 ease-out will-change-transform"
                            style={{
                                transform: `translateY(${
                                    (index() - currentIndex()) * 100
                                }vh)`,
                            }}
                        >
                            <PaperCard paper={paper} />
                        </div>
                    )}
                </For>
            </div>
            {isLoading() && (
                <div class="fixed bottom-4 left-1/2 transform -translate-x-1/2">
                    <div class="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full">
                        Loading more papers...
                    </div>
                </div>
            )}
        </main>
    );
}