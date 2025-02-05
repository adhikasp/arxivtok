import { createSignal, onMount, For, createEffect, Show } from "solid-js";
import { PaperCard } from "@/components/PaperCard";
import { SearchBar } from "@/components/SearchBar";
import { AboutDialog } from "@/components/ui/AboutDialog";
import { fetchPapers } from "@/lib/papers";

export default function Home() {
    const [papers, setPapers] = createSignal<any[]>([]);
    const [currentIndex, setCurrentIndex] = createSignal(0);
    const [page, setPage] = createSignal(0);
    const [isLoading, setIsLoading] = createSignal(false);
    const [searchQuery, setSearchQuery] = createSignal("");
    const [touchStart, setTouchStart] = createSignal(0);
    const [touchEnd, setTouchEnd] = createSignal(0);
    const [isAboutOpen, setIsAboutOpen] = createSignal(false);
    const [currentSource, setCurrentSource] = createSignal<"arxiv" | "medrxiv">("arxiv");
    const [isScrolling, setIsScrolling] = createSignal(false);
    const minSwipeDistance = 50;
    const scrollCooldown = 200;

    const loadPapers = async (reset = false) => {
        if (isLoading()) return;
        setIsLoading(true);
        try {
            const newPapers = await fetchPapers({
                page: reset ? 0 : page(),
                perPage: 10,
                query: searchQuery(),
                source: currentSource(),
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

    const scrollToNext = () => {
        if (!isScrolling() && currentIndex() < papers().length - 1) {
            setIsScrolling(true);
            setCurrentIndex((i) => i + 1);
            setTimeout(() => setIsScrolling(false), scrollCooldown);
        }

        if (currentIndex() >= papers().length - 2) {
            loadPapers();
        }
    };

    const scrollToPrevious = () => {
        if (!isScrolling() && currentIndex() > 0) {
            setIsScrolling(true);
            setCurrentIndex((i) => i - 1);
            setTimeout(() => setIsScrolling(false), scrollCooldown);
        }
    };

    const handleScroll = (e: WheelEvent) => {
        e.preventDefault();
        if (isLoading() || isScrolling()) return;

        if (e.deltaY > 0) {
            scrollToNext();
        } else if (e.deltaY < 0) {
            scrollToPrevious();
        }
    };

    const handleTouchStart = (e: TouchEvent) => {
        setTouchStart(e.changedTouches[0].screenY);
    };

    const handleTouchMove = (e: TouchEvent) => {
        setTouchEnd(e.changedTouches[0].screenY);
        // Prevent default scrolling behavior
        if (Math.abs(touchStart() - e.changedTouches[0].screenY) > 10) {
            e.preventDefault();
        }
    };

    const handleTouchEnd = () => {
        if (isLoading() || isScrolling()) return;

        const swipeDistance = touchStart() - touchEnd();

        if (Math.abs(swipeDistance) > minSwipeDistance) {
            if (swipeDistance > 0) {
                scrollToNext();
            } else {
                scrollToPrevious();
            }
        }

        // Reset touch values
        setTouchStart(0);
        setTouchEnd(0);
    };

    onMount(() => {
        loadPapers();
        window.addEventListener("wheel", handleScroll, { passive: false });
        window.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener("wheel", handleScroll);
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
        };
    });

    return (
        <main
            class="h-screen w-screen overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 touch-none overscroll-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div class="fixed top-0 left-0 right-0 z-50 h-16 px-3 sm:px-6 bg-gradient-to-b from-white/80 to-transparent backdrop-blur-sm">
                <div class="max-w-7xl mx-auto h-full flex items-center justify-between">
                    <div class="flex items-center space-x-2 sm:space-x-4 h-full">
                        <div class="flex-shrink-0">
                            <div>
                                <h1 class="text-xl sm:text-2xl font-bold tracking-tight">
                                    <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                                        ArXiv
                                    </span>
                                    <span class="text-gray-900">Tok</span>
                                </h1>
                                <p class="hidden sm:block text-sm text-gray-500 mt-1">
                                    Discover research, swipe by swipe
                                </p>
                            </div>
                        </div>

                        <Show when={searchQuery()}>
                            <div class="flex items-center pl-2 sm:pl-4 border-l border-gray-200">
                                <span class="hidden sm:inline text-xs text-gray-400 mr-2">
                                    Filtering:
                                </span>
                                <div class="flex items-center bg-blue-50 px-2 py-1 rounded-md">
                                    <span class="text-xs sm:text-sm text-blue-700 font-medium truncate max-w-[100px] sm:max-w-[150px]">
                                        {searchQuery()}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setSearchQuery("");
                                            loadPapers(true);
                                        }}
                                        class="ml-1 sm:ml-2 text-blue-400 hover:text-blue-600"
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

                        <div class="hidden sm:flex items-center space-x-2 pl-4 border-l border-gray-200">
                            <select
                                value={currentSource()}
                                onChange={(e) => {
                                    setCurrentSource(
                                        e.currentTarget.value as
                                            | "arxiv"
                                            | "medrxiv"
                                    );
                                    loadPapers(true);
                                }}
                                class="text-sm rounded-md border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="arxiv">arXiv</option>
                                <option value="medrxiv">medRxiv</option>
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAboutOpen(true)}
                        class="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100/50"
                        title="About ArXivTok"
                    >
                        <svg
                            class="w-4 h-4 sm:w-5 sm:h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            <AboutDialog
                isOpen={isAboutOpen()}
                onOpenChange={setIsAboutOpen}
            />

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