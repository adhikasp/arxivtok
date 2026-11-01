# ArXivTok 📱

A TikTok-style interface for exploring research papers across multiple sources including arXiv, medRxiv, bioRxiv, PubMed and HackerNews.

## ✨ Features

- 📱 TikTok-style vertical swipe interface
- 🎯 Multi-source paper browsing (arXiv, medRxiv, bioRxiv, PubMed, HackerNews)
- 🧠 AI-powered abstract simplification using OpenRouter (GPT 6 Luna)
- 👤 Customizable explanation personas (college student, professional, layman)
- ❤️ Save favorite papers
- 🔍 Real-time search with suggestions
- 📲 Touch-optimized mobile experience
- 🧮 LaTeX math rendering support
- 🔄 Infinite scroll loading
- 📱 Responsive design for all devices

## 🛠️ Tech Stack

- **Frontend**: SolidJS + SolidStart, built as a static SPA (no SSR)
- **API**: Rust (axum + reqwest) in [`server/`](server)
- **Styling**: TailwindCSS
- **Math Rendering**: KaTeX
- **AI**: OpenRouter (default `openai/gpt-6-luna`, high reasoning)
- **Linting**: ESLint with TypeScript and SolidJS plugins
- **APIs**: 
  - arXiv API
  - medRxiv API
  - bioRxiv API
  - PubMed API
  - HackerNews API

## 🚀 Getting Started

Requirements: Node 22+, pnpm, Rust (stable).

```bash
git clone https://github.com/adhikasp/arxivtok.git
cd arxivtok
pnpm install

# 1. API (port 3001). OPENROUTER_API_KEY is optional: without it abstracts are returned unmodified.
cp .env.example .env   # then edit
(cd server && set -a && . ../.env && set +a && cargo run)

# 2. Frontend dev server (proxies /api to 127.0.0.1:3001; override with API_URL)
pnpm dev
```

### Configuration (environment of the API)

| Variable | Default | |
|---|---|---|
| `OPENROUTER_API_KEY` | – | enables LLM abstract rewriting |
| `OPENROUTER_MODEL` | `openai/gpt-6-luna` | any OpenRouter model id |
| `REASONING_EFFORT` | `high` | OpenRouter `reasoning.effort` |
| `BIND` | `127.0.0.1:3001` | listen address |
| `STATIC_DIR` | – | also serve the built frontend (single-binary mode) |

### Production build

```bash
pnpm build                                  # static files -> .output/public
(cd server && cargo build --release)        # binary -> server/target/release/arxivtok
```

Serve `.output/public` with any web server (falling back to `index.html`) and proxy `/api/*` to the binary,
or run `STATIC_DIR=.output/public arxivtok` for a single process. [`deploy/`](deploy) has a Caddy and a systemd example.

## 📱 Usage

- **Swipe up/down**: Navigate between papers
- **Double tap**: Like/unlike paper
- **Tap links**: Open source papers
- **Search bar**: Find specific papers
- **Source selector**: Switch between paper sources
- **Persona selector**: Change how abstracts are explained
  - **Default**: Simplified for general audience
  - **College Student**: Explained for students in that field
  - **Professional**: Technical explanation for experts
  - **Layman**: Simple explanation for non-technical readers

## 🧹 Linting & tests

The project uses ESLint to maintain code quality and consistency:

```bash
# Run linter
pnpm lint

# Fix automatically fixable issues
pnpm lint:fix

# API tests
(cd server && cargo test)
```

The linter is configured to catch:
- Unused imports and variables
- Import ordering issues
- SolidJS reactivity issues
- Basic code hygiene problems

## 📚 API Integration

The app integrates with multiple academic paper sources:

- arXiv: Computer Science, Physics, Mathematics
- medRxiv: Medical research preprints
- bioRxiv: Biology research preprints
- PubMed: Life sciences and biomedical literature
- HackerNews: Tech-focused discussions and papers

## 🏗️ Codebase Structure

```
server/              # Rust API
├── src/main.rs      # routes: GET /api/papers, GET /api/health
├── src/sources.rs   # arXiv / medRxiv / bioRxiv / PubMed / HN fetchers
└── src/llm.rs       # OpenRouter abstract simplification (personas, cache)
src/                 # SolidJS SPA
├── components/      # UI components (PaperCard, SearchBar, ...)
├── lib/             # papers.ts, favorites.ts, progress.ts, ...
├── routes/          # pages
└── app.tsx
deploy/              # Caddy + systemd examples
```

### Key Components

- **PaperCard.tsx**: Main component for displaying individual papers with LaTeX support
- **PaperRoulette.tsx**: Handles the TikTok-style paper swiping interface
- **SearchBar.tsx**: Implements real-time search with suggestions
- **SourceMixer.tsx**: Controls paper source selection and mixing
- **PersonaSelector.tsx**: Controls abstract explanation style
- **FavoritesModal.tsx**: Manages saved/favorite papers

### Core Libraries

- **papers.ts**: Core paper data fetching and processing
- **favorites.ts**: Local storage management for favorite papers
- **progress.ts**: User progress and achievement tracking

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - See [LICENSE](LICENSE) for details