import { Component, For } from "solid-js";
import type { Source } from "@/lib/papers";

interface SourceMixerProps {
  selectedSources: Source[];
  onSourcesChange: (sources: Source[]) => void;
}

const sources: { id: Source; name: string; description: string; icon: string }[] = [
  {
    id: "arxiv",
    name: "arXiv",
    description: "Computer Science & Physics",
    icon: "🔬"
  },
  {
    id: "medrxiv",
    name: "medRxiv",
    description: "Medical Research",
    icon: "🏥"
  },
  {
    id: "biorxiv",
    name: "bioRxiv",
    description: "Biology Research",
    icon: "🧬"
  },
  {
    id: "pubmed",
    name: "PubMed",
    description: "Life Sciences",
    icon: "📚"
  },
  {
    id: "hackernews",
    name: "HackerNews",
    description: "Tech Discussions",
    icon: "💻"
  }
];

export const SourceMixer: Component<SourceMixerProps> = (props) => {
  return (
    <div class="p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Mix Sources</h3>
      <div class="space-y-2">
        <For each={sources}>
          {(source) => (
            <button
              onClick={() => {
                const isSelected = props.selectedSources.includes(source.id);
                if (isSelected) {
                  props.onSourcesChange(props.selectedSources.filter(s => s !== source.id));
                } else {
                  props.onSourcesChange([...props.selectedSources, source.id]);
                }
              }}
              class={`w-full flex items-center p-3 rounded-xl transition-all duration-200
                     ${props.selectedSources.includes(source.id)
                       ? "bg-blue-50 border-blue-200 shadow-sm"
                       : "bg-gray-50 hover:bg-gray-100 border-transparent"} 
                     border-2`}
            >
              <span class="text-2xl mr-3">{source.icon}</span>
              <div class="text-left">
                <div class="font-medium text-gray-900">{source.name}</div>
                <div class="text-sm text-gray-500">{source.description}</div>
              </div>
              <div class="ml-auto">
                <div class={`w-6 h-6 rounded-full border-2 transition-colors
                            ${props.selectedSources.includes(source.id)
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"}`}
                >
                  {props.selectedSources.includes(source.id) && (
                    <svg class="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          )}
        </For>
      </div>
    </div>
  );
};
