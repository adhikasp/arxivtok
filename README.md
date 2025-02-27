# ArXivTok 📱

A TikTok-style interface for exploring research papers across multiple sources including arXiv, medRxiv, bioRxiv, PubMed and HackerNews.

## ✨ Features

- 📱 TikTok-style vertical swipe interface
- 🎯 Multi-source paper browsing (arXiv, medRxiv, bioRxiv, PubMed, HackerNews)
- 🧠 AI-powered abstract simplification using Google's Gemini
- 👤 Customizable explanation personas (college student, professional, layman)
- ❤️ Save favorite papers
- 🔍 Real-time search with suggestions
- 📲 Touch-optimized mobile experience
- 🧮 LaTeX math rendering support
- 🔄 Infinite scroll loading
- 📱 Responsive design for all devices

## 🛠️ Tech Stack

- **Framework**: SolidJS + SolidStart
- **Styling**: TailwindCSS
- **Math Rendering**: KaTeX
- **AI**: Google Gemini API
- **Linting**: ESLint with TypeScript and SolidJS plugins
- **APIs**: 
  - arXiv API
  - medRxiv API
  - bioRxiv API
  - PubMed API
  - HackerNews API

## 🚀 Getting Started

1. Clone and install dependencies:
```bash
git clone https://github.com/yourusername/arxiv-tok.git
cd arxiv-tok
npm install
```

2. (Optional) Set up Gemini API key:
   - Copy `.env.example` to `.env`
   - Add your Gemini API key to `GEMINI_API_KEY`
   - If you don't configure this, the app will return the original abstract.

3. Run development server:
```bash
npm run dev
```

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

## 🧹 Linting

The project uses ESLint to maintain code quality and consistency:

```bash
# Run linter
pnpm lint

# Fix automatically fixable issues
pnpm lint:fix
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

The project follows a standard SolidStart application structure:

```
src/
├── components/      # Reusable UI components
│   ├── ui/          # Basic UI elements
│   ├── PaperCard    # Paper display component
│   ├── SearchBar    # Search functionality
│   └── ...          # Other components
├── lib/             # Core utilities and business logic
│   ├── papers.ts    # Paper data management
│   ├── favorites.ts # Favorites functionality
│   ├── gemini.ts    # AI abstract simplification
│   └── progress.ts  # Progress tracking
├── routes/          # Application routes/pages
├── app.tsx          # Main application component
└── app.css          # Global styles
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
- **gemini.ts**: AI-powered abstract simplification with persona support
- **progress.ts**: User progress and achievement tracking

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - See [LICENSE](LICENSE) for details