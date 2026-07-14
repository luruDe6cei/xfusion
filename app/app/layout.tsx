import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Poppins } from 'next/font/google';

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

function Nav() {
  const links = [
    ['/', 'Explore'],
    ['/challenges', 'Challenges'],
    ['/solutions', 'Solutions'],
    ['/organizations', 'Organizations'],
  ];
  return (
    <header style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--color-grey-white-90)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 48, height: 64 }}>
        <Link href="/" style={{ fontWeight: 700, letterSpacing: '.02em', fontSize: 18 }}>
          x<span style={{ color: 'var(--color-primary)' }}>FUSION</span>
        </Link>
        <nav style={{ display: 'flex', gap: 20 }}>
          {links.map(([href, label]) => (
            <Link key={href} href={href} style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>{label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <Nav />
        <main className="container" style={{ padding: '32px 20px 80px' }}>{children}</main>
        <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 0' }}>
          <div className="container muted" style={{ fontSize: 13 }}>
            Local clone for development — data scraped from the public xfusion.pro API.
          </div>
        </footer>
      </body>
    </html>
  );
}
