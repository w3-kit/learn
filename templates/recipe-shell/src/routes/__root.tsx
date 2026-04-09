import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "../lib/wagmi";
import type { ReactNode } from "react";
import "../styles/tokens.css";

const queryClient = new QueryClient();

const themeScript = [
  "(function(){",
  "var t=localStorage.getItem('w3-theme')||'system';",
  "var d=document.documentElement;",
  "var isDark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches);",
  "if(isDark)d.classList.add('dark');",
  "})();",
].join("");

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "w3-kit Recipe" },
    ],
    links: [],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <Outlet />
        </QueryClientProvider>
      </WagmiProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
