import { Component, createSignal, Show } from "solid-js";
import { Paper, Source } from "@/lib/papers";

const ROULETTE_QUOTES = [
    "Discovering serendipity...",
    "Finding hidden gems...",
    "Expanding your mind...",
    "Exploring new frontiers...",
    "Connecting ideas...",
    "Unlocking knowledge...",
    "Finding inspiration...",
    "Curating discoveries...",
    "Venturing beyond the known...",
    "Embracing the unexpected...",
    "Igniting curiosity...",
    "Serendipitous explorations...",
    "Illuminating new perspectives...",
    "Unearthing breakthroughs...",
    "Delving into the unknown...",
];

const RANDOM_QUERY_COMBINATIONS = [
    ["quantum computing", "entanglement", "teleportation"],
    ["artificial intelligence", "consciousness", "ethics"],
    ["robotics", "human-computer interaction", "automation"],
    ["neural networks", "deep learning", "cognitive science"],
    ["space exploration", "astrophysics", "exoplanets"],
    ["blockchain technology", "cryptography", "decentralization"],
    ["synthetic biology", "genetic engineering", "biotechnology"],
    ["climate change", "environmental science", "sustainability"],
    ["personalized medicine", "genomics", "bioinformatics"],
    ["social media", "network analysis", "digital humanities"],
    ["cybersecurity", "threat intelligence", "vulnerability assessment"],
    ["renewable energy", "energy storage", "smart grids"],
    ["urban planning", "smart cities", "sustainable development"],
    ["virtual reality", "augmented reality", "extended reality"],
    ["materials science", "nanotechnology", "advanced manufacturing"],
    ["game theory", "mechanism design", "behavioral economics"],
    ["cultural evolution", "memetics", "sociobiology"],
    ["algorithmic bias", "fairness", "explainable AI"],
    ["precision agriculture", "remote sensing", "crop monitoring"],
    ["regenerative medicine", "stem cells", "tissue engineering"],
    ["ancient history", "archaeology", "cultural heritage"],
    ["behavioral economics", "cognitive biases", "decision making"],
    ["dark matter", "dark energy", "cosmology"],
    ["quantum gravity", "string theory", "loop quantum gravity"],
    [
        "neuromorphic computing",
        "brain-inspired algorithms",
        "cognitive architectures",
    ],
    ["social robotics", "human-robot collaboration", "ethical implications"],
    ["sustainable agriculture", "agroecology", "food security"],
    ["biomimicry", "nature-inspired design", "ecological engineering"],
    [
        "computational linguistics",
        "natural language understanding",
        "machine translation",
    ],
    [
        "quantum cryptography",
        "secure communication",
        "post-quantum cryptography",
    ],
    ["cognitive neuroscience", "brain imaging", "neuroplasticity"],
    ["digital art", "generative algorithms", "interactive installations"],
    ["epigenetics", "gene regulation", "heritable changes"],
    ["swarm intelligence", "collective behavior", "distributed systems"],
    ["predictive policing", "algorithmic accountability", "ethical concerns"],
    ["quantum machine learning", "quantum algorithms", "data analysis"],
    ["neuroethics", "ethical implications of neuroscience", "moral reasoning"],
    ["sustainable tourism", "ecotourism", "community-based tourism"],
    ["algorithmic trading", "high-frequency trading", "market microstructure"],
    ["integrative medicine", "holistic health", "wellness practices"],
    ["serious games", "game-based learning", "behavioral change"],
    ["planetary defense", "asteroid deflection", "space situational awareness"],
    ["affective computing", "emotion recognition", "user interfaces"],
    ["quantum simulation", "materials discovery", "drug design"],
    ["neuroaesthetics", "brain responses to art", "aesthetic experiences"],
    ["sustainable fashion", "ethical sourcing", "circular economy"],
    ["algorithmic art", "creative coding", "generative design"],
    ["computational sociology", "social networks", "agent-based modeling"],
    ["quantum sensors", "precision measurement", "imaging technologies"],
    [
        "neuroeconomics",
        "brain activity and economic decisions",
        "risk aversion",
    ],
    ["sustainable fishing", "aquaculture", "marine conservation"],
    ["algorithmic music", "computer-generated music", "music composition"],
    ["integrative education", "holistic development", "personalized learning"],
];

const SOURCES: Source[] = [
    "arxiv",
    "medrxiv",
    "biorxiv",
    "pubmed",
    "hackernews",
];

interface PaperRouletteProps {
    papers: Paper[];
    onSelect: (paper: Paper) => void;
    onRandomize?: (sources: Source[], queries: string[]) => Promise<void>;
}

export const PaperRoulette: Component<PaperRouletteProps> = (props) => {
    const [isSpinning, setIsSpinning] = createSignal(false);
    const [quote, setQuote] = createSignal(ROULETTE_QUOTES[0]);

    const getRandomCombination = () => {
        const combination =
            RANDOM_QUERY_COMBINATIONS[
                Math.floor(Math.random() * RANDOM_QUERY_COMBINATIONS.length)
            ];
        const numWords = Math.random() > 0.5 ? 2 : 3;
        const shuffled = [...combination].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, numWords);
        return selected;
    };

    const getRandomSources = () => {
        const numSources = Math.floor(Math.random() * 3) + 1;
        const shuffled = [...SOURCES].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, numSources);
    };

    const spin = async () => {
        if (isSpinning() || props.papers.length === 0) return;

        setIsSpinning(true);

        let quoteIndex = 0;
        const quoteInterval = setInterval(() => {
            quoteIndex = (quoteIndex + 1) % ROULETTE_QUOTES.length;
            setQuote(ROULETTE_QUOTES[quoteIndex]);
        }, 150);

        try {
            const randomSources = getRandomSources();
            const randomQuery = getRandomCombination();

            if (props.onRandomize) {
                await props.onRandomize(randomSources, randomQuery);
            }

            await new Promise((resolve) => setTimeout(resolve, 2000));

            const randomIndex = Math.floor(Math.random() * props.papers.length);
            props.onSelect(props.papers[randomIndex]);
        } finally {
            clearInterval(quoteInterval);
            setIsSpinning(false);
        }
    };

    return (
        <div class="fixed bottom-24 right-6 z-30">
            <button
                onClick={spin}
                disabled={isSpinning()}
                class={`group relative flex items-center justify-center p-4 
                            bg-white/90 backdrop-blur-xl border border-white/20
                            rounded-2xl shadow-lg shadow-black/5 hover:shadow-xl
                            transition-all duration-500 ease-out
                            ${isSpinning() ? "scale-110" : "hover:scale-105"}
                            disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Discover Something Amazing"
            >
                <div
                    class={`absolute inset-0 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 
                            rounded-2xl transition-opacity duration-500
                            ${isSpinning() ? "opacity-100" : "opacity-0"}`}
                />

                <div class="relative flex items-center gap-3">
                    <div
                        class={`transform transition-all duration-500
                                ${
                                    isSpinning()
                                        ? "animate-spin-slow"
                                        : "group-hover:rotate-180"
                                }`}
                    >
                        <svg
                            class="w-6 h-6 text-gray-900"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </div>
                    <span
                        class={`text-sm font-medium text-gray-900 whitespace-nowrap
                                transition-all duration-300
                                ${
                                    isSpinning()
                                        ? "opacity-0 translate-x-2"
                                        : "group-hover:text-gray-700"
                                }`}
                    >
                        Surprise Me
                    </span>
                </div>
            </button>

            <Show when={isSpinning()}>
                <div class="absolute bottom-full right-0 mb-3 pointer-events-none">
                    <div
                        class="relative bg-white/95 backdrop-blur-xl rounded-2xl px-4 py-3
                               shadow-lg shadow-black/5 border border-white/20
                               animate-in slide-in-from-bottom-2 duration-500"
                    >
                        <div
                            class="absolute -bottom-2 right-6 w-4 h-4 bg-white/95 
                                  transform rotate-45 border-b border-r border-white/20"
                        />
                        <div class="relative text-sm text-gray-900 font-medium">
                            {quote()}
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
};
