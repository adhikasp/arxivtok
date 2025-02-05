import { createSignal, onMount, For, createEffect, Show } from "solid-js";
import { PaperCard } from "@/components/PaperCard";
import { SearchBar } from "@/components/SearchBar";
import { AboutDialog } from "@/components/ui/AboutDialog";
import { fetchPapers } from "@/lib/papers";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { QueryBadge } from "@/components/QueryBadge";

export default function Home() {
    const [papers, setPapers] = createSignal<any[]>([]);
    const [currentIndex, setCurrentIndex] = createSignal(0);
    const [page, setPage] = createSignal(0);
    const [isLoading, setIsLoading] = createSignal(false);
    const [touchStart, setTouchStart] = createSignal(0);
    const [touchEnd, setTouchEnd] = createSignal(0);
    const [isAboutOpen, setIsAboutOpen] = createSignal(false);
    const [currentSource, setCurrentSource] = createSignal<"arxiv" | "medrxiv">("arxiv");
    const [isScrolling, setIsScrolling] = createSignal(false);
    const [activeQueries, setActiveQueries] = createSignal<string[]>([]);
    const [showAllQueries] = createSignal(false);
    const minSwipeDistance = 50;
    const scrollCooldown = 200;

    const loadPapers = async (reset = false) => {
        if (isLoading()) return;
        setIsLoading(true);
        try {
            const newPapers = await fetchPapers({
                page: reset ? 0 : page(),
                perPage: 10,
                queries: activeQueries(),
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
        setActiveQueries(prev => [...new Set([...prev, query])]);
        loadPapers(true);
    };

    const removeQuery = (queryToRemove: string) => {
        setActiveQueries(prev => prev.filter(q => q !== queryToRemove));
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
        >
            <div class="fixed top-0 left-0 right-0 z-50 h-16 px-3 sm:px-6 bg-gradient-to-b from-white/80 to-transparent backdrop-blur-sm">
                <div class="max-w-7xl mx-auto h-full flex items-center relative">
                    <div class="flex-none flex items-center space-x-2 sm:space-x-4 h-full">
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

                        <div class="flex items-center pl-4 border-l border-gray-200">
                            <DropdownMenu>
                                <DropdownMenuTrigger class="inline-flex items-center justify-center rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium bg-white hover:bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                    <span class="mr-2">
                                        {currentSource() === "arxiv"
                                            ? "arXiv"
                                            : "medRxiv"}
                                    </span>
                                    <svg
                                        class="w-4 h-4 text-gray-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setCurrentSource("arxiv");
                                            loadPapers(true);
                                        }}
                                    >
                                        <div class="flex items-center">
                                            <svg
                                                class={`w-4 h-4 mr-2 ${
                                                    currentSource() === "arxiv"
                                                        ? "text-blue-500"
                                                        : "text-transparent"
                                                }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                            <span>arXiv</span>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setCurrentSource("medrxiv");
                                            loadPapers(true);
                                        }}
                                    >
                                        <div class="flex items-center">
                                            <svg
                                                class={`w-4 h-4 mr-2 ${
                                                    currentSource() ===
                                                    "medrxiv"
                                                        ? "text-blue-500"
                                                        : "text-transparent"
                                                }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                            <span>medRxiv</span>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <Show when={activeQueries().length > 0}>
                        <div class="flex-1 mx-4 min-w-0">
                            <div class="w-full flex items-center gap-1.5 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
                                <div class="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                    {activeQueries()
                                        .map((query) => (
                                            <QueryBadge
                                                query={query}
                                                onRemove={() =>
                                                    removeQuery(query)
                                                }
                                                compact={!showAllQueries()}
                                            />
                                        ))}
                                </div>
                                <button
                                    onClick={() => {
                                        setActiveQueries([]);
                                        loadPapers(true);
                                    }}
                                    class="ml-1 p-1 -mr-0.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100/50"
                                    title="Clear all filters"
                                >
                                    <svg
                                        class="w-3.5 h-3.5"
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
                    <button
                        onClick={() => setIsAboutOpen(true)}
                        class="absolute right-0 p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100/50"
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

            <AboutDialog isOpen={isAboutOpen()} onOpenChange={setIsAboutOpen} />

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