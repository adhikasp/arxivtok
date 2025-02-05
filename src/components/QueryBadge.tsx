import { Component, JSX, Show } from "solid-js";
import { Dialog } from "./ui/dialog";

interface QueryBadgeProps {
    query: string;
    onRemove: () => void;
    compact?: boolean;
    class?: string;
}

export const QueryBadge: Component<QueryBadgeProps> = (props): JSX.Element => {
    return (
        <div class="flex-shrink-0 flex items-center bg-blue-50 px-2 py-0.5 rounded-full group hover:bg-blue-100 transition-colors">
            <Show when={props.compact}>
                <span class="w-2 h-2 rounded-full bg-blue-400 mr-1.5" />
            </Show>
            <span class='text-xs text-blue-700 font-medium'>
                {props.query}
            </span>
            <button
                onClick={props.onRemove}
                class="ml-1.5 text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove filter"
            >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
    );
};
