import { Component, Show } from "solid-js";

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
    return (
        <article class="h-full w-full flex items-center justify-center p-4 sm:p-8">
            <div class="paper-card max-w-2xl w-full h-[85vh] overflow-y-auto rounded-2xl p-6 sm:p-8">
                <h2 class="text-xl sm:text-2xl md:text-3xl font-bold mb-4 leading-tight tracking-tight">
                    {props.paper.title}
                </h2>
                
                <div class="flex items-center space-x-2 mb-6">
                    <span class="text-sm text-gray-500">
                        {new Date(props.paper.published).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </span>
                    <span class="text-gray-300">•</span>
                    <Show when={props.paper.pdfLink}>
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

                <p class="text-gray-600 text-base sm:text-lg leading-relaxed mb-6">
                    {props.paper.summary}
                </p>

                <div class="flex flex-wrap gap-2 mt-auto">
                    {props.paper.authors.map(author => (
                        <span class="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-sm text-gray-600 transition-colors">
                            {author}
                        </span>
                    ))}
                </div>
            </div>
        </article>
    );
};
