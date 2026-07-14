import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Poppins } from 'next/font/google';
import { NavAuth } from './nav-auth';

// The real site ships Poppins; globals.css consumes this via --font-poppins.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'xFUSION — Business Challenge Platform (clone)',
  description: 'Local reconstruction built from scraped public data.',
};

// Mirrors the real site's header: routes, then in-page anchors into the landing
// page's sections (About/Features/Contact are NOT separate routes upstream).
const NAV = [
  ['/explore', 'Explore'],
  ['/challenges', 'Challenges'],
  ['/solutions', 'Solutions'],
  ['/organizations', 'Organizations'],
  ['/#about', 'About'],
  ['/#features', 'Features'],
  ['/#contact', 'Contact us'],
];

function Nav() {
  return (
    <header style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--color-grey-white-90)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 40, height: 64 }}>
        <Link href="/" style={{ fontWeight: 700, letterSpacing: '.02em', fontSize: 18 }}>
          x<span style={{ color: 'var(--color-primary)' }}>FUSION</span>
        </Link>
        <nav style={{ display: 'flex', gap: 18, flex: 1 }}>
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} style={{ fontSize: 15 }}>{label}</Link>
          ))}
        </nav>
        {/* Swaps between Log in/Sign up and the logged-in avatar menu. Mock only —
            see lib/mock-auth.ts. */}
        <NavAuth />
      </div>
    </header>
  );
}

const FOOTER = [
  ['Who we are', [['/', 'Main'], ['/#about', 'About'], ['/#features', 'Features']]],
  ['Platform', [['/explore', 'Explore'], ['/challenges', 'Challenges'], ['/solutions', 'Solutions'], ['/organizations', 'Organizations'], ['/#why', 'Why us'], ['/#how-it-works', 'How it Works']]],
  ['Contact', [['/#contact', 'Contact us']]],
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <Nav />
        <main className="container" style={{ padding: '0 20px 40px' }}>{children}</main>
        <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--color-grey-white)', padding: '48px 0 28px' }}>
          <div className="container">
            <div className="footer-grid">
              {FOOTER.map(([heading, links]) => (
                <div key={heading}>
                  <h3>{heading}</h3>
                  {links.map(([href, label]) => (
                    <Link key={label} href={href}>{label}</Link>
                  ))}
                </div>
              ))}
              <div>
                <h3>Legal</h3>
                {/* Upstream serves these at /pages/*; we haven't rebuilt them. */}
                <a href="https://www.xfusion.pro/pages/privacy-policy">Privacy Policy</a>
                <a href="https://www.xfusion.pro/pages/terms-and-conditions">Terms &amp; Conditions</a>
              </div>
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 36, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              Local clone for development — data from the public xfusion.pro API.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
