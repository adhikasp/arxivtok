// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
    <StartServer
        document={({ assets, children, scripts }) => (
            <html lang="en">
                <head>
                    <meta charset="utf-8" />
                    <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1.0"
                    />
                    <meta name="theme-color" content="#3b82f6" />
                    <link rel="manifest" href="/manifest.json" />
                    <link rel="icon" href="/favicon.ico" />
                    <link rel="apple-touch-icon" href="/icon-192.png" />

                    {/* Open Graph / Facebook */}
                    <meta property="og:type" content="website" />
                    <meta property="og:url" content="https://arxivtok.adhikasp.my.id/" />
                    <meta property="og:title" content="ArXivTok - Research Papers in TikTok Style" />
                    <meta property="og:description" content="Explore research papers from arXiv, medRxiv, bioRxiv, PubMed and HackerNews with a TikTok-style interface. Features AI-powered abstract simplification, LaTeX rendering, and real-time search." />
                    <meta property="og:image" content="/demo.png" />

                    {/* Twitter */}
                    <meta property="twitter:card" content="summary_large_image" />
                    <meta property="twitter:url" content="https://arxivtok.adhikasp.my.id/" />
                    <meta property="twitter:title" content="ArXivTok - Research Papers in TikTok Style" />
                    <meta property="twitter:description" content="Explore research papers from arXiv, medRxiv, bioRxiv, PubMed and HackerNews with a TikTok-style interface. Features AI-powered abstract simplification, LaTeX rendering, and real-time search." />
                    <meta property="twitter:image" content="/demo.png" />

                    {assets}
                </head>
                <body>
                    <div id="app">{children}</div>

                    {scripts}
                    <script
                        async
                        src="https://scripts.simpleanalyticscdn.com/latest.js"
                    ></script>
                </body>
            </html>
        )}
    />
));
