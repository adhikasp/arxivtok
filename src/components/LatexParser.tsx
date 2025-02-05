import { Component, JSX, createEffect, createSignal, onMount } from "solid-js";

interface LatexParserProps {
    text: string;
    isTitle?: boolean;
    class?: string;
}

interface MathJax {
    typesetPromise: (elements: HTMLElement[]) => Promise<void>;
    startup: {
        promise: Promise<void>;
    };
}

declare global {
    interface Window {
        MathJax: MathJax;
    }
}

export const LatexParser: Component<LatexParserProps> = (props): JSX.Element => {
    const [parsedContent, setParsedContent] = createSignal("");
    let containerRef: HTMLDivElement | undefined;

    const renderMath = async (content: string) => {
        if (!window.MathJax) {
            console.warn("MathJax not loaded yet");
            return content;
        }

        try {
            const processed = content
                .replace(/\$\$(.*?)\$\$/g, '\\[$1\\]')
                .replace(/\$(.*?)\$/g, '\\($1\\)');

            setParsedContent(processed);

            setTimeout(() => {
                if (containerRef && window.MathJax) {
                    // @ts-ignore
                    window.MathJax.typesetPromise([containerRef]);
                }
            }, 0);

        } catch (error) {
            console.error("Error rendering LaTeX:", error);
            return content;
        }
    };

    createEffect(() => {
        renderMath(props.text);
    });

    onMount(() => {
        if (!window.MathJax) {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
            script.async = true;
            document.head.appendChild(script);

            script.onload = () => {
                // @ts-ignore
                window.MathJax.startup.promise.then(() => {
                    renderMath(props.text);
                });
            };
        }
    });

    return (
        <div 
            ref={containerRef}
            class={props.isTitle 
                ? "text-xl sm:text-2xl font-bold leading-tight tracking-tight" 
                : "text-base leading-relaxed text-gray-700"}
            innerHTML={parsedContent()}
        />
    );
};
