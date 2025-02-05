import { Component, Show, createSignal, onMount } from "solid-js";

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
    let contentRef: HTMLDivElement | undefined;

    onMount(() => {
        if (contentRef) {
            setIsScrollable(contentRef.scrollHeight > contentRef.clientHeight);
        }
    });

    const handleWheel = (e: WheelEvent) => {
        if (!contentRef) return;

        const isAtTop = contentRef.scrollTop === 0;
        const isAtBottom =
            contentRef.scrollTop + contentRef.clientHeight >=
            contentRef.scrollHeight;

        // If we're scrolling up at the top or down at the bottom, let the parent handle it
        if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
            return;
        }

        // Otherwise, handle the scroll internally and prevent paper change
        e.stopPropagation();
    };

    const handleTouch = (e: TouchEvent) => {
        if (!contentRef) return;

        const isAtTop = contentRef.scrollTop === 0;
        const isAtBottom =
            contentRef.scrollTop + contentRef.clientHeight >=
            contentRef.scrollHeight;

        // Only stop propagation if we're not at the edges
        if (!isAtTop && !isAtBottom) {
            e.stopPropagation();
        }
    };

    return (
        <article class="h-full w-full flex items-center justify-center p-4 sm:p-8">
            <div class="relative paper-card max-w-2xl w-full h-[85vh] rounded-2xl bg-white shadow-xl">
                {/* Scroll indicator */}
                <Show when={isScrollable()}>
                    <div class="absolute top-2 right-2 bg-gray-800/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        Scroll to read more
                    </div>
                </Show>

                {/* Content container */}
                <div
                    ref={contentRef}
                    class="h-full overflow-y-auto p-6 sm:p-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
                    onWheel={handleWheel}
                    onTouchMove={handleTouch}
                >
                    {/* Title section */}
                    <div class="mb-6">
                        <h2 class="text-xl sm:text-2xl md:text-3xl font-bold leading-tight tracking-tight">
                            {props.paper.title}
                        </h2>

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

                    {/* Summary section */}
                    <div class="space-y-4 mb-8">
                        <p class="text-gray-600 text-base sm:text-lg leading-relaxed whitespace-pre-line">
                            {props.paper.summary}
                        </p>
                    </div>

                    {/* Authors section */}
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
