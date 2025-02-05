// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
    <StartServer
        document={({ assets, children, scripts }) => (
            <html lang="en">
                <head>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <meta name="theme-color" content="#3b82f6" />
                    <link rel="manifest" href="/manifest.json" />
                    <link rel="icon" href="/favicon.ico" />
                    <link rel="apple-touch-icon" href="/icon-192.png" />
                    {assets}
                </head>
                <body>
                    <div id="app">{children}</div>
                    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>

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
