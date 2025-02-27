import { Component } from "solid-js";

interface QueryBadgeProps {
    query: string;
    onRemove: () => void;
    compact?: boolean;
    class?: string;
}

export const QueryBadge: Component<QueryBadgeProps> = (props) => {
    return (
        <div class={`
            flex items-center gap-1 px-2.5 py-1 rounded-lg
            bg-gradient-to-b from-white/80 to-white/60
            backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.04)]
            border border-white/40
            hover:from-white/90 hover:to-white/70
            transition-all duration-200 ease-out
            group animate-in fade-in
            ${props.class || ''}
        `}>
            <span class="text-xs font-medium bg-gradient-to-b from-blue-600 to-blue-700 
                         bg-clip-text text-transparent tracking-tight">
                {props.query}
            </span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    props.onRemove();
                }}
                class="w-4 h-4 flex items-center justify-center rounded-full
                       bg-blue-50/50 opacity-0 group-hover:opacity-100
                       hover:bg-blue-100/80 transition-all duration-200"
                aria-label="Remove filter"
            >
                <svg 
                    class="w-2.5 h-2.5 text-blue-600" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path 
                        stroke-linecap="round" 
                        stroke-linejoin="round" 
                        stroke-width="2.5" 
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
        </div>
    );
};
