import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { Atmosphere } from "@/components/three/Atmosphere";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SoundToggle } from "@/components/SoundToggle";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Discontinued 96–00 Civic (EK/EJ) Parts, Reproduced`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
  // icon.svg is the modern icon; favicon.ico lives in public/ because browsers,
  // crawlers, and link unfurlers request /favicon.ico whatever the markup says.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0c0e",
  width: "device-width",
  initialScale: 1,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  logo: `${SITE_URL}/logo.svg`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/*
         * Scroll reveals (see Reveal.tsx / globals.css) hide content until an
         * IntersectionObserver reveals it. Gating that solely on the .reveal
         * class is a real hazard: if a visitor's JS is slow, blocked, or
         * errors before this runs, that content stays invisible forever —
         * and a couple of below-the-fold sections did exactly that. Standard
         * fix: hiding only takes effect once this script stamps `.js` on
         * <html>. beforeInteractive runs synchronously before first paint, so
         * JS-enabled visitors never see a flash; anyone without JS running
         * (including a script-stripped static preview) gets the content
         * fully visible by default instead of permanently hidden.
         */}
        <Script id="js-flag" strategy="beforeInteractive">
          {`document.documentElement.classList.add("js")`}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-accent focus:px-4 focus:py-2 focus:font-medium focus:text-accent-ink"
        >
          Skip to content
        </a>
        <Atmosphere />
        <Header />
        {/* tabIndex={-1} lets the skip link actually move focus here. Without
            it the hash changes but focus stays on <body>, so the next Tab
            restarts at the top of the page and the skip link does nothing. */}
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer />
        <SoundToggle />
      </body>
    </html>
  );
}
