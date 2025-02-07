import { Component, createSignal, Show, onMount, onCleanup } from "solid-js";
import { isServer } from "solid-js/web";

interface SearchBarProps {
    onSearch: (query: string) => void;
    initialSuggestions?: string[];
    recentSearches?: string[];
    onClearRecent?: () => void;
}

export const SearchBar: Component<SearchBarProps> = (props) => {
    const [isExpanded, setIsExpanded] = createSignal(false);
    const [query, setQuery] = createSignal("");
    const [isFocused, setIsFocused] = createSignal(false);
    const [activeIndex, setActiveIndex] = createSignal(-1);
    let inputRef: HTMLInputElement | undefined;
    let formRef: HTMLFormElement | undefined;
    let suggestionsRef: HTMLDivElement | undefined;

    const suggestions = props.initialSuggestions || [
        "Machine Learning",
        "Deep Learning",
        "Neural Networks",
        "Computer Vision",
        "Natural Language Processing",
        "Reinforcement Learning",
    ];

    const recentSearches = () => props.recentSearches || [];

    const filteredSuggestions = () => {
        const queryLower = query().toLowerCase();
        return suggestions.filter((s) => s.toLowerCase().includes(queryLower));
    };

    const handleSearch = (searchQuery: string) => {
        if (searchQuery.trim()) {
            props.onSearch(searchQuery.trim());
            setQuery("");
            setIsExpanded(false);
            inputRef?.blur();
        }
    };

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        handleSearch(query());
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        const suggestions = filteredSuggestions();
        const maxIndex = suggestions.length - 1;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setActiveIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
                break;
            case "ArrowUp":
                e.preventDefault();
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
                break;
            case "Enter":
                if (activeIndex() >= 0) {
                    e.preventDefault();
                    handleSearch(suggestions[activeIndex()]);
                }
                break;
            case "Escape":
                e.preventDefault();
                setIsExpanded(false);
                setActiveIndex(-1);
                inputRef?.blur();
                break;
        }
    };

    onMount(() => {
        if (!isServer) {
            const handleClickOutside = (event: MouseEvent) => {
                if (formRef && !formRef.contains(event.target as Node)) {
                    setIsExpanded(false);
                    setIsFocused(false);
                    setActiveIndex(-1);
                }
            };

            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);

            onCleanup(() => {
                document.removeEventListener("mousedown", handleClickOutside);
                document.removeEventListener("keydown", handleKeyDown);
            });
        }
    });

    return (
        <div class="fixed top-10 sm:top-2 right-4 z-50 px-3 sm:px-4 sm:pb-0">
            <form ref={formRef} onSubmit={handleSubmit} class=" relative">
                <div
                    class='transform transition-all duration-300 ease-out scale-100'
                            
                >
                    <div class="relative h-12">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search papers..."
                            value={query()}
                            onInput={(e) => {
                                setQuery(e.currentTarget.value);
                                setIsExpanded(true);
                                setActiveIndex(-1);
                            }}
                            onFocus={() => {
                                setIsExpanded(true);
                                setIsFocused(true);
                            }}
                            class={`h-full pl-5 pr-12 rounded-xl
                                   bg-white/90 backdrop-blur-md border border-gray-200/50
                                   focus:border-blue-500 outline-none shadow-sm
                                   transition-all duration-300 ease-out
                                   ${
                                       isExpanded()
                                           ? "opacity-100 translate-y-0"
                                           : "hidden -translate-y-2"
                                   }
                                   ${
                                       isFocused()
                                           ? "ring-2 ring-blue-100 shadow-lg"
                                           : ""
                                   }
                                   text-gray-700 text-base placeholder:text-gray-400`}
                        />
                        <button
                            type={isExpanded() ? "submit" : "button"}
                            onClick={() => {
                                if (!isExpanded()) {
                                    setIsExpanded(true);
                                    setTimeout(() => inputRef?.focus(), 150);
                                }
                            }}
                            class={`absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 
                                   flex items-center justify-center
                                   rounded-lg transition-all duration-300 ease-out
                                   ${
                                       isExpanded()
                                           ? "bg-blue-500 hover:bg-blue-600 text-white scale-100"
                                           : "bg-white shadow-sm hover:bg-gray-50 text-gray-600 scale-90"
                                   }
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   hover:scale-105 active:scale-95`}
                            disabled={isExpanded() && !query().trim()}
                        >
                            <svg
                                class="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                <Show
                    when={
                        isExpanded() &&
                        (query().length > 0 || recentSearches().length > 0)
                    }
                >
                    <div
                        class="absolute mt-3 bg-white/95 backdrop-blur-xl rounded-xl 
                                shadow-xl border border-gray-100 overflow-hidden
                                transform transition-all duration-200 ease-out"
                    >
                        <div
                            ref={suggestionsRef}
                            class="max-h-[300px] overflow-y-auto overscroll-contain"
                        >
                            <Show
                                when={recentSearches().length > 0 && !query()}
                            >
                                <div class="px-4 py-2 flex justify-between items-center">
                                    <span class="text-xs font-medium text-gray-400">
                                        Recent Searches
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => props.onClearRecent?.()}
                                        class="text-xs text-blue-500 hover:text-blue-600"
                                    >
                                        Clear All
                                    </button>
                                </div>
                                {recentSearches().map((search) => (
                                    <button
                                        type="button"
                                        onClick={() => handleSearch(search)}
                                        class=" px-4 py-3 text-left flex items-center space-x-3
                                               hover:bg-gray-50 transition-colors duration-150"
                                    >
                                        <svg
                                            class="w-4 h-4 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <span class="text-gray-600">
                                            {search}
                                        </span>
                                    </button>
                                ))}
                                <div class="h-px bg-gray-100 mx-4"></div>
                            </Show>

                            {query() &&
                                filteredSuggestions().map(
                                    (suggestion, index) => (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSearch(suggestion)
                                            }
                                            class={`px-4 py-3 text-left flex items-center space-x-3
                                           transition-colors duration-150
                                           ${
                                               index === activeIndex()
                                                   ? "bg-blue-50 text-blue-700"
                                                   : "text-gray-700 hover:bg-gray-50"
                                           }`}
                                        >
                                            <svg
                                                class="w-4 h-4 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                />
                                            </svg>
                                            <span>{suggestion}</span>
                                        </button>
                                    )
                                )}
                        </div>
                    </div>
                </Show>
            </form>
        </div>
    );
};
