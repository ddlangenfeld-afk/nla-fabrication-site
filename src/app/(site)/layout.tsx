import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SoundToggle } from "@/components/SoundToggle";

/*
 * Chrome for the public site.
 *
 * A route group — the (site) folder name never appears in a URL — so every
 * page keeps the path it already had, while /ops sits outside this layout and
 * renders without any of it.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-accent focus:px-4 focus:py-2 focus:font-medium focus:text-accent-ink"
      >
        Skip to content
      </a>
      <Header />
      {/* tabIndex={-1} lets the skip link actually move focus here. Without it
          the hash changes but focus stays on <body>, so the next Tab restarts
          at the top of the page and the skip link does nothing. */}
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
      <SoundToggle />
    </>
  );
}
