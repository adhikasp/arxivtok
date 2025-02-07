import { Component, createMemo, createSignal, For, onMount, Show, Switch, Match } from "solid-js";
import katex from "katex";
import { favorites, useFavorites } from "@/lib/favorites";
import { Paper } from "@/lib/papers";
import { updateReadingProgress } from "@/lib/progress";
import { TutorialOverlay } from "./TutorialOverlay";
import { AchievementToast } from "./AchievementToast";

interface LatexParserProps {
    text: string;
    isTitle?: boolean;
}

const PATTERNS = {
    INLINE_MATH: /\$([^\$]+)\$|\\\(([^\)]+)\\\)/g,
    DISPLAY_MATH: /\$\$([^\$]+)\$\$|\\\[([^\]]+)\\\]/g,
    SYMBOLS: {
        "\\alpha": "α",
        "\\beta": "β",
        "\\gamma": "γ",
        "\\delta": "δ",
        "\\epsilon": "ε",
        "\\zeta": "ζ",
        "\\eta": "η",
        "\\theta": "θ",
        "\\iota": "ι",
        "\\kappa": "κ",
        "\\lambda": "λ",
        "\\mu": "μ",
        "\\nu": "ν",
        "\\xi": "ξ",
        "\\pi": "π",
        "\\rho": "ρ",
        "\\sigma": "σ",
        "\\tau": "τ",
        "\\upsilon": "υ",
        "\\phi": "φ",
        "\\chi": "χ",
        "\\psi": "ψ",
        "\\omega": "ω",
        "\\infty": "∞",
        "\\pm": "±",
        "\\times": "×",
        "\\div": "÷",
        "\\leq": "≤",
        "\\geq": "≥",
        "\\neq": "≠",
        "\\approx": "≈",
        "\\cdot": "·",
    },
    FORMATTING: {
        textbf: /\\textbf\{([^}]+)\}/g,
        textit: /\\textit\{([^}]+)\}/g,
        underline: /\\underline\{([^}]+)\}/g,
        emph: /\\emph\{([^}]+)\}/g,
    },
    CITATIONS: /\\cite\{([^}]+)\}/g,
    REFERENCES: /\\ref\{([^}]+)\}/g,
};

const formatText = (text: string) => {
    text = text.replace(
        PATTERNS.FORMATTING.textbf,
        '<span class="font-bold">$1</span>'
    );
    text = text.replace(
        PATTERNS.FORMATTING.textit,
        '<span class="italic">$1</span>'
    );
    text = text.replace(
        PATTERNS.FORMATTING.underline,
        '<span class="underline">$1</span>'
    );
    text = text.replace(
        PATTERNS.FORMATTING.emph,
        '<span class="italic">$1</span>'
    );

    text = text.replace(
        PATTERNS.CITATIONS,
        '<span class="text-blue-500 cursor-pointer">[citation]</span>'
    );
    text = text.replace(
        PATTERNS.REFERENCES,
        '<span class="text-blue-500 cursor-pointer">[ref]</span>'
    );

    Object.entries(PATTERNS.SYMBOLS).forEach(([symbol, replacement]) => {
        text = text.replaceAll(symbol, replacement);
    });

    return text;
};

export const LatexParser: Component<LatexParserProps> = (props) => {
    const parsedContent = createMemo(() => {
        let content = props.text;
        let segments: Array<{
            type: "text" | "math" | "display-math";
            content: string;
        }> = [];
        let lastIndex = 0;

        content = content.replace(PATTERNS.DISPLAY_MATH, (match, g1, g2) => {
            const formula = g1 || g2;
            try {
                return `<div class="my-4 px-4 py-2 overflow-x-auto">${katex.renderToString(
                    formula,
                    { displayMode: true }
                )}</div>`;
            } catch (error) {
                console.error("KaTeX error:", error);
                return `<div class="my-4 px-4 py-2 text-red-500 border border-red-300 rounded bg-red-50">${formula}</div>`;
            }
        });

        const matches = Array.from(content.matchAll(PATTERNS.INLINE_MATH));

        matches.forEach((match) => {
            const formula = match[1] || match[2];
            const startIndex = match.index!;

            if (startIndex > lastIndex) {
                segments.push({
                    type: "text",
                    content: formatText(content.slice(lastIndex, startIndex)),
                });
            }

            try {
                segments.push({
                    type: "math",
                    content: katex.renderToString(formula, {
                        displayMode: false,
                    }),
                });
            } catch (error) {
                console.error("KaTeX error:", error);
                segments.push({
                    type: "text",
                    content: formula,
                });
            }

            lastIndex = startIndex + match[0].length;
        });

        if (lastIndex < content.length) {
            segments.push({
                type: "text",
                content: formatText(content.slice(lastIndex)),
            });
        }

        return segments;
    });

    return (
        <div class={`text-base leading-relaxed text-gray-700 ${props.isTitle ? 'text-xl sm:text-2xl md:text-3xl font-bold leading-tight tracking-tight' : ''}`}>
            <For each={parsedContent()}>
                {(segment) => (
                    <Show
                        when={segment.type === "text"}
                        fallback={
                            <span
                                class={`
                                    ${
                                        segment.type === "display-math"
                                            ? "block my-4"
                                            : "inline"
                                    } 
                                    [&_.katex]:text-lg
                                    [&_.katex-display]:my-4
                                    [&_.katex-display]:overflow-x-auto
                                    [&_.katex-display]:overflow-y-hidden
                                    [&_.katex-display]:py-2
                                `}
                                innerHTML={segment.content}
                            />
                        }
                    >
                        <span innerHTML={segment.content} />
                    </Show>
                )}
            </For>
        </div>
    );
};

interface PaperCardProps {
    paper: Paper;
    showTutorial?: boolean;
    onTutorialDismiss?: () => void;
}

const sourceIcons = {
    arxiv: { icon: "🔬", color: "bg-blue-50 text-blue-700" },
    medrxiv: { icon: "🏥", color: "bg-green-50 text-green-700" },
    biorxiv: { icon: "🧬", color: "bg-purple-50 text-purple-700" },
    pubmed: { icon: "📚", color: "bg-amber-50 text-amber-700" },
    hackernews: { icon: "💻", color: "bg-orange-50 text-orange-700" }
} as const;

export const PaperCard: Component<PaperCardProps> = (props) => {
    const { isFavorite, addFavorite, removeFavorite } = useFavorites();
    const [isScrollable, setIsScrollable] = createSignal(false);
    const [touchStartY, setTouchStartY] = createSignal(0);
    const [scrollStartPosition, setScrollStartPosition] = createSignal(0);
    const [isInteracting, setIsInteracting] = createSignal(false);
    const [lastTap, setLastTap] = createSignal(0);
    const [showHeartAnimation, setShowHeartAnimation] = createSignal(false);
    const [initialTouch, setInitialTouch] = createSignal<{ y: number; time: number } | null>(null);
    const [isScrolling, setIsScrolling] = createSignal(false);
    const [lastScrollPosition, setLastScrollPosition] = createSignal(0);
    const [currentAchievement, setCurrentAchievement] = createSignal<{
        title: string;
        description: string;
        icon: string;
    } | null>(null);
    let contentRef: HTMLDivElement | undefined;
    let summaryRef: HTMLDivElement | undefined;

    onMount(() => {
        if (contentRef) {
            setIsScrollable(contentRef.scrollHeight > contentRef.clientHeight);
        }
    });

    const handleWheel = (e: WheelEvent) => {
        if (!summaryRef) return;

        const isAtTop = summaryRef.scrollTop === 0;
        const isAtBottom = summaryRef.scrollTop + summaryRef.clientHeight >= summaryRef.scrollHeight - 1;

        // Solo detener la propagación cuando realmente estamos scrolleando el contenido
        if (summaryRef.scrollHeight > summaryRef.clientHeight) {
            const canScrollUp = e.deltaY < 0 && !isAtTop;
            const canScrollDown = e.deltaY > 0 && !isAtBottom;

            if (canScrollUp || canScrollDown) {
                e.stopPropagation();
            }
        }
    };

    const handleTouchStart = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName.toLowerCase() === 'a' || target.closest('a')) return;

        const touch = e.touches[0];
        setInitialTouch({ y: touch.clientY, time: Date.now() });
        setIsScrolling(false);
        setTouchStartY(touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!summaryRef || !initialTouch()) return;

        const touch = e.touches[0];
        const deltaY = touchStartY() - touch.clientY;
        const isAtTop = summaryRef.scrollTop === 0;
        const isAtBottom = summaryRef.scrollTop + summaryRef.clientHeight >= summaryRef.scrollHeight;

        // Solo detener la propagación cuando estamos realmente scrolleando el contenido
        if (summaryRef.scrollHeight > summaryRef.clientHeight) {
            const canScrollContent = (deltaY > 0 && !isAtBottom) || (deltaY < 0 && !isAtTop);
            
            if (canScrollContent) {
                e.stopPropagation();
                summaryRef.scrollTop += deltaY;
                setIsScrolling(true);
            }
        }
    };

    const handleTouchEnd = (e: TouchEvent) => {
        if (isScrolling()) {
            e.stopPropagation();
        }
        setInitialTouch(null);
        setIsScrolling(false);
    };

    const handleDoubleTap = (e: MouseEvent | TouchEvent) => {
        const target = e.target as HTMLElement;
        const isLink = target.tagName.toLowerCase() === 'a' || target.closest('a');
        
        if (isLink) return;

        e.preventDefault();
        e.stopPropagation();
        
        if (e instanceof TouchEvent) {
            const now = Date.now();
            const DOUBLE_TAP_DELAY = 300;
            
            if (now - lastTap() < DOUBLE_TAP_DELAY) {
                toggleFavoriteWithAnimation();
            }
            
            setLastTap(now);
        }
    };

    const handleDoubleClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavoriteWithAnimation();
    };

    const toggleFavoriteWithAnimation = () => {
        if (!isFavorite(props.paper.id)) {
            setShowHeartAnimation(true);
            setTimeout(() => setShowHeartAnimation(false), 1000);
        }
        toggleFavorite();
    };

    const toggleFavorite = () => {
        if (isFavorite(props.paper.id)) {
            removeFavorite(props.paper.id);
        } else {
            addFavorite(props.paper);
            // Mostrar achievement si es el primer favorito
            const favCount = favorites().length;
            if (favCount === 1) {
                setCurrentAchievement({
                    title: "First Favorite!",
                    description: "You've saved your first paper",
                    icon: "⭐"
                });
                setTimeout(() => setCurrentAchievement(null), 3000);
            }
        }
    };

    return (
        <article class="h-full w-full flex items-center justify-center p-4 sm:p-8">
            <div class="relative paper-card max-w-2xl w-full h-[85vh] rounded-2xl bg-white shadow-xl flex flex-col">
                {/* Header section with badges */}
                <div class="flex justify-between items-start p-4 sm:p-6">
                    <div class="flex items-center space-x-2">
                        <div class={`flex items-center px-2.5 py-1 rounded-full ${sourceIcons[props.paper.source].color} bg-opacity-50`}>
                            <span class="text-base mr-1.5">{sourceIcons[props.paper.source].icon}</span>
                            <span class="text-xs font-medium">
                                {props.paper.source === "arxiv" ? "arXiv" :
                                 props.paper.source === "medrxiv" ? "medRxiv" :
                                 props.paper.source === "biorxiv" ? "bioRxiv" :
                                 props.paper.source === "pubmed" ? "PubMed" : "HackerNews"}
                            </span>
                        </div>
                        <span class="text-xs text-gray-500">
                            {new Date(props.paper.published).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                            })}
                        </span>
                    </div>
                    <button
                        onClick={toggleFavorite}
                        class="p-2 bg-white shadow-md rounded-full hover:bg-gray-50 
                               transition-all duration-300 active:scale-95 transform hover:scale-105"
                    >
                        <svg class={`w-6 h-6 ${isFavorite(props.paper.id) ? "text-red-500 fill-current" : "text-gray-400"}`}
                             viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>

                {/* Title section */}
                <div class="px-4 sm:px-6 pb-4">
                    <LatexParser text={props.paper.title} isTitle />
                    <Show when={props.paper.pdfLink}>
                        <a href={props.paper.pdfLink}
                           target="_blank"
                           rel="noopener noreferrer"
                           class="inline-flex items-center mt-2 text-sm text-blue-500 hover:text-blue-600">
                            <svg class="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                            </svg>
                            View source
                        </a>
                    </Show>
                </div>

                {/* Scrollable summary */}
                <div ref={summaryRef}
                     class="flex-1 px-4 sm:px-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300/50 
                            scrollbar-track-transparent hover:scrollbar-thumb-gray-300"
                     style="touch-action: pan-y;"
                     onWheel={handleWheel}
                     onTouchStart={handleTouchStart}
                     onTouchMove={handleTouchMove}
                     onTouchEnd={handleTouchEnd}
                     onDblClick={handleDoubleClick}
                     onClick={handleDoubleTap}>
                    <div class="space-y-4 pb-4">
                        <LatexParser text={props.paper.summary} />
                    </div>
                </div>

                {/* Footer with authors */}
                <div class="p-4 sm:p-6 border-t border-gray-100">
                    <div class="flex flex-wrap gap-1.5">
                        {props.paper.authors.map((author) => (
                            <span class="inline-flex text-xs px-2 py-1 rounded-full bg-gray-100 
                                       text-gray-600 hover:bg-gray-200 transition-colors">
                                {author}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Achievement components */}
                <Show when={currentAchievement()}>
                    <AchievementToast {...currentAchievement()!} show={true} />
                </Show>

            {/* Tutorial overlay */}
            <Show when={props.showTutorial}>
                <TutorialOverlay onDismiss={props.onTutorialDismiss} />
            </Show>
            </div>
        </article>
    );
};
