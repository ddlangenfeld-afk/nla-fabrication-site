/*
 * The ops panel renders bare — no site header, no marketing footer, no sound
 * toggle. It is an internal tool, and every pixel of shop chrome on it is
 * either noise or an invitation to click something irrelevant while reading
 * numbers.
 *
 * <main> rather than a bare div so the document still has a landmark, since
 * the one in the (site) layout doesn't apply here.
 */
export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="flex-1">
      {children}
    </main>
  );
}
