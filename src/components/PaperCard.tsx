import { Component, createMemo, createSignal, For, onMount, Show } from "solid-js";

const MathJaxRenderer: Component<{ math: string; displayMode?: boolean }> = (props) => {
    let container: HTMLSpanElement | HTMLDivElement | undefined;

    onMount(() => {
        if (container && 'MathJax' in window) {
            container.innerHTML = props.displayMode
                ? `\\[${props.math}\\]`
                : `\\(${props.math}\\)`;

            // @ts-ignore
            window.MathJax.typesetPromise([container]).catch((err: any) =>
                console.error("MathJax typeset failed:", err)
            );
        } 
        // @ts-ignore
        else if (!window.MathJax) {
            console.error("MathJax no está cargado en window.MathJax");
        }
    });

    return props.displayMode ? (
        <div ref={(el) => (container = el)} />
    ) : (
        <span ref={(el) => (container = el)} />
    );
};

const PATTERNS = {
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
    text = text.replace(PATTERNS.FORMATTING.textbf, '<span class="font-bold">$1</span>');
    text = text.replace(PATTERNS.FORMATTING.textit, '<span class="italic">$1</span>');
    text = text.replace(PATTERNS.FORMATTING.underline, '<span class="underline">$1</span>');
    text = text.replace(PATTERNS.FORMATTING.emph, '<span class="italic">$1</span>');
    text = text.replace(PATTERNS.CITATIONS, '<span class="text-blue-500 cursor-pointer">[citation]</span>');
    text = text.replace(PATTERNS.REFERENCES, '<span class="text-blue-500 cursor-pointer">[ref]</span>');

    Object.entries(PATTERNS.SYMBOLS).forEach(([symbol, replacement]) => {
        text = text.replaceAll(symbol, replacement);
    });

    return text;
};

export const LatexParser: Component<{ text: string; isTitle?: boolean }> = (props) => {
    const [parsedContent, setParsedContent] = createSignal<Array<{type: "text" | "math" | "display-math" | "chem"; content: string;}>>([]);

    onMount(() => {
        const text = props.text;
        const segments: Array<{type: "text" | "math" | "display-math" | "chem"; content: string;}> = [];
        let lastIndex = 0;

        const chemPattern = /\\ce\{([^}]+)\}/;
        const displayMathPattern = /\$\$([^\$]+)\$\$|\\\[([^\]]+)\\\]/;
        const inlineMathPattern = /\$([^\$]+)\$|\\\(([^\)]+)\\\)/;
        const combinedPattern = new RegExp(`${chemPattern.source}|${displayMathPattern.source}|${inlineMathPattern.source}`, "g");

        let match: RegExpExecArray | null;
        while ((match = combinedPattern.exec(text)) !== null) {
            const start = match.index;
            if (start > lastIndex) {
                let plainText = text.substring(lastIndex, start);
                plainText = formatText(plainText);
                segments.push({ type: "text", content: plainText });
            }
            let formula = "";
            let type: "math" | "display-math" | "chem" = "math";
            if (match[1]) {
                formula = match[1];
                type = "chem";
            }
            else if (match[2] || match[3]) {
                formula = match[2] || match[3];
                type = "display-math";
            }
            else if (match[4] || match[5]) {
                formula = match[4] || match[5];
                type = "math";
            }
            segments.push({ type, content: formula });
            lastIndex = combinedPattern.lastIndex;
        }
        if (lastIndex < text.length) {
            let remaining = text.substring(lastIndex);
            remaining = formatText(remaining);
            segments.push({ type: "text", content: remaining });
        }
        setParsedContent(segments);
    });

    return (
        props.isTitle ? (
            <h2 class="text-xl sm:text-2xl md:text-3xl font-bold leading-tight tracking-tight">
                <For each={parsedContent()}>
                    {(segment) => {
                        if (segment.type === "text") {
                            return <span innerHTML={segment.content} />;
                        }
                        if (segment.type === "chem") {
                            return (
                                <span class="inline [&_.MathJax]:text-lg">
                                    <MathJaxRenderer
                                        math={`\\ce{${segment.content}}`}
                                        displayMode={false}
                                    />
                                </span>
                            );
                        }
                        if (segment.type === "math") {
                            return (
                                <span class="inline [&_.MathJax]:text-lg">
                                    <MathJaxRenderer
                                        math={segment.content}
                                        displayMode={false}
                                    />
                                </span>
                            );
                        }
                        return (
                            <div class="block my-4 px-4 py-2 overflow-x-auto [&_.MathJax]:text-lg [&_.MathJax-display]:my-4">
                                <MathJaxRenderer
                                    math={segment.content}
                                    displayMode={true}
                                />
                            </div>
                        );
                    }}
                </For>
            </h2>
        ) : (
            <div class="text-base leading-relaxed text-gray-700">
                <For each={parsedContent()}>
                    {(segment) => {
                        if (segment.type === "text") {
                            return <span innerHTML={segment.content} />;
                        }
                        if (segment.type === "chem") {
                            return (
                                <span class="inline [&_.MathJax]:text-lg">
                                    <MathJaxRenderer
                                        math={`\\ce{${segment.content}}`}
                                        displayMode={false}
                                    />
                                </span>
                            );
                        }
                        if (segment.type === "math") {
                            return (
                                <span class="inline [&_.MathJax]:text-lg">
                                    <MathJaxRenderer
                                        math={segment.content}
                                        displayMode={false}
                                    />
                                </span>
                            );
                        }
                        return (
                            <div class="block my-4 px-4 py-2 overflow-x-auto [&_.MathJax]:text-lg [&_.MathJax-display]:my-4">
                                <MathJaxRenderer
                                    math={segment.content}
                                    displayMode={true}
                                />
                            </div>
                        );
                    }}
                </For>
            </div>
        )
    );
};

interface Paper {
    id: string;
    title: string;
    summary: string;
    authors: string[];
    published: string;
    pdfLink?: string;
}

interface PaperCardProps {
    paper: Paper;
}

export const PaperCard: Component<PaperCardProps> = (props) => {
    const [isScrollable, setIsScrollable] = createSignal(false);
    const [touchStartY, setTouchStartY] = createSignal(0);
    const [scrollStartPosition, setScrollStartPosition] = createSignal(0);
    let contentRef: HTMLDivElement | undefined;

    onMount(() => {
        if (contentRef) {
            setIsScrollable(contentRef.scrollHeight > contentRef.clientHeight);
        }
    });

    const handleWheel = (e: WheelEvent) => {
        if (!contentRef) return;
        const isAtTop = contentRef.scrollTop === 0;
        const isAtBottom = contentRef.scrollTop + contentRef.clientHeight >= contentRef.scrollHeight - 1;
        if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) return;
        e.stopPropagation();
    };

    const handleTouchStart = (e: TouchEvent) => {
        if (!contentRef) return;
        setTouchStartY(e.touches[0].clientY);
        setScrollStartPosition(contentRef.scrollTop);
        const isAtTop = contentRef.scrollTop === 0;
        const isAtBottom = contentRef.scrollTop + contentRef.clientHeight >= contentRef.scrollHeight - 1;
        if (!isAtTop && !isAtBottom) {
            e.stopPropagation();
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!contentRef) return;
        const currentY = e.touches[0].clientY;
        const touchDelta = touchStartY() - currentY;
        const isAtTop = contentRef.scrollTop === 0;
        const isAtBottom = contentRef.scrollTop + contentRef.clientHeight >= contentRef.scrollHeight - 1;
        if (!isAtTop && !isAtBottom) {
            e.stopPropagation();
            e.preventDefault();
            contentRef.scrollTop = scrollStartPosition() + touchDelta;
            return;
        }
        if (isAtTop && touchDelta > 0) {
            e.stopPropagation();
            e.preventDefault();
            contentRef.scrollTop = touchDelta;
            return;
        }
        if (isAtBottom && touchDelta < 0) {
            e.stopPropagation();
            e.preventDefault();
            contentRef.scrollTop = scrollStartPosition() + touchDelta;
            return;
        }
    };

    const handleTouchEnd = (e: TouchEvent) => {
        if (!contentRef) return;
        const isAtTop = contentRef.scrollTop === 0;
        const isAtBottom = contentRef.scrollTop + contentRef.clientHeight >= contentRef.scrollHeight - 1;
        if (!isAtTop && !isAtBottom) {
            e.stopPropagation();
        }
    };

    return (
        <article class="h-full w-full flex items-center justify-center p-4 sm:p-8">
            <div class="relative paper-card max-w-2xl w-full h-[85vh] rounded-2xl bg-white shadow-xl">
                <Show when={isScrollable()}>
                    <div class="absolute top-2 right-2 bg-gray-800/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        Scroll to read more
                    </div>
                </Show>

                <div
                    ref={contentRef}
                    class="h-full overflow-y-auto overscroll-contain p-6 sm:p-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
                    onWheel={handleWheel}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div class="mb-6">
                        <LatexParser text={props.paper.title} isTitle />
                        <div class="flex items-center space-x-2 mt-4">
                            <span class="text-sm text-gray-500">
                                {new Date(
                                    props.paper.published
                                ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </span>
                            <Show when={props.paper.pdfLink}>
                                <span class="text-gray-300">•</span>
                                <a
                                    href={props.paper.pdfLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="text-blue-500 hover:text-blue-600 text-sm font-medium transition-colors"
                                >
                                    View PDF
                                </a>
                            </Show>
                        </div>
                    </div>

                    <div class="space-y-4 mb-8">
                        <LatexParser text={props.paper.summary} />
                    </div>

                    <div class="border-t pt-6">
                        <h3 class="text-sm font-medium text-gray-500 mb-3">
                            Authors
                        </h3>
                        <div class="flex flex-wrap gap-2">
                            {props.paper.authors.map((author) => (
                                <span class="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-sm text-gray-600 transition-colors">
                                    {author}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
};
