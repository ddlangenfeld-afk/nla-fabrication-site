import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { Atmosphere } from "@/components/three/Atmosphere";
import { MARKETPLACES, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
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
  /* sameAs is how search engines tie the marketplace storefronts to this
     entity rather than treating them as unrelated sellers. Omitted entirely
     when nothing is configured — an empty array is a weaker signal than no
     property at all. */
  ...(MARKETPLACES.length > 0 ? { sameAs: MARKETPLACES.map((m) => m.url) } : {}),
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
        <Atmosphere />
        {/*
         * Header, footer, skip link and sound toggle live in the (site) route
         * group, not here. /ops is an internal instrument panel: shop
         * navigation, a marketing footer and an ambient-audio toggle floating
         * over a margin table are noise at best and misleading at worst. Only
         * things every document needs — fonts, the .js flag, the atmosphere
         * layer, organisation metadata — belong at this level.
         */}
        {children}
      </body>
    </html>
  );
}
