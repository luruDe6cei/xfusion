import Link from 'next/link';
import { getChallenges, getSolutions } from '@/lib/data';
import { ChallengeCard, SolutionCard } from './components';

/**
 * Landing page — reconstructed from the real xfusion.pro homepage
 * (scraper/snapshot/html/index.html). The nav's About/Features/Contact are
 * in-page anchors into these sections, not separate routes — same as upstream.
 * Featured challenges/solutions come from our DB, not hardcoded copy.
 */

const ABOUT = [
  {
    n: '01',
    color: 'var(--color-orange-1)',
    title: 'Connecting organizations, not just industries.',
    body: 'xFUSION brings together organizations of every type, from global enterprises and startups to public institutions and research bodies, enabling collaboration across size, sector, and structure within a single marketplace.',
  },
  {
    n: '02',
    color: 'var(--color-pink-1)',
    title: 'Innovation works in two directions — xFUSION looks at innovation from both sides.',
    body: 'From challenges searching for solutions — and from existing solutions searching for meaningful, real-world needs. We believe true innovation happens when both perspectives meet.',
  },
  {
    n: '03',
    color: 'var(--color-violet-5)',
    title: 'Making connections intentional, not accidental. Serendipity is powerful — but unreliable.',
    body: 'xFUSION turns serendipitous discovery into a structured, transparent, and repeatable process, allowing organizations and innovators to systematically find the right opportunity, not just stumble upon it.',
  },
];

// Each card is tinted with an upstream --gradient-*-card token + a solid left bar,
// per the captured homepage (auth-shots/index.png).
const FEATURES = [
  ['AI-Driven Matching', 'Our AI matches challenges with best-fit solutions across sectors, accelerating discovery and enabling faster, higher-quality collaborations.', 'var(--color-orange-1)', 'var(--gradient-warning-card)'],
  ['Cross-Industry Collaboration', 'Access a global library of proven solutions, enabling the use of innovations from various industries to solve complex challenges and foster creative synergy.', 'var(--color-pink-1)', 'var(--gradient-error-card)'],
  ['Privacy & Security', 'Collaborate within a secure, interactive environment that protects intellectual property and supports trust between partners, with strict privacy controls.', 'var(--color-blue-1)', 'var(--gradient-matched-card)'],
  ['Full Workflow Integration', 'Manage solutions from submission to implementation seamlessly, with tools that facilitate ongoing communication and provide detailed analytics at every stage.', 'var(--color-violet-4)', 'var(--gradient-info-card)'],
  ['Sustainable Knowledge Repository', 'Unmatched solutions are retained in a Solution Bank for future challenges, creating a sustainable knowledge base and increasing the likelihood of future matches.', 'var(--color-green-1)', 'var(--gradient-success-card)'],
  ['API Integration', 'An API designed for handling large data sets, tailored for use by TTOs, universities, and research organizations, enhancing access and collaboration.', 'var(--color-violet-upload)', 'var(--gradient-upload-card)'],
];

// Copy transcribed from the captured homepage — each tile is a solid coloured
// header block (white text) over a white body, with a matching left bar.
const STATS = [
  ['30%', 'Increase in R&D Cost Efficiency', 'Cross-industry innovation at xFUSION leads to more efficient research and development, reducing costs by repurposing technologies from diverse fields.', 'var(--color-orange-1)'],
  ['40%', 'Much Faster Time-to-Market', 'Our collaborative process accelerates the path from idea to implementation, enabling faster product launches and reducing time-to-market by up to 40%.', 'var(--color-pink-1)'],
  ['10%', 'Improvement in Solution Ideation & Validation', 'By leveraging cross-disciplinary expertise, xFUSION delivers validated solutions that address complex challenges more effectively, enhancing ideation and validation rates.', 'var(--color-violet-5)'],
  ['50%', 'More Industry-Academia Collaboration', 'xFUSION bridges the gap between academia and industry, boosting collaborative efforts that drive scientific advancements and practical solutions.', 'var(--color-violet-4)'],
  ['5x', 'Increase in Market Reach & Revenue Potential', 'Cross-industry partnerships expand into new markets, creating exponential growth opportunities for products and technologies.', 'var(--color-green-1)'],
  ['100+', 'Partners Across Different Industries', 'Our extensive network of partners enables breakthrough solutions, harnessing insights from leaders in multiple high-impact sectors.', 'var(--color-violet-6)'],
];

const HOW = [
  {
    head: 'When you start with a challenge',
    sub: '(For organizations seeking solutions)',
    steps: [
      ['Define the challenge', 'Clearly describe the challenge, its context, and the desired outcome — without prescribing how it should be solved.'],
      ['Discover cross-industry solutions', 'Receive relevant solutions submitted proactively by organizations and innovators, alongside AI-driven matches identified by xFUSION across industries.'],
      ['Engage and move forward', 'Connect directly to validate fit, explore pilots, and build meaningful collaborations.'],
    ],
  },
  {
    head: 'When you start with a solution',
    sub: '(For innovators, startups, and solution providers)',
    steps: [
      ['Present your solution and capabilities', 'Share what your solution does, where it delivers value, and what makes it relevant.'],
      ['Find real-world needs and opportunities', "Actively explore challenges and submit your solution — or let xFUSION's AI identify relevant real-world needs and potential partners."],
      ['Collaborate and scale', 'Start conversations, align on use cases, and pursue pilots, partnerships, or new applications.'],
    ],
  },
];

export default async function LandingPage() {
  const challenges = (await getChallenges()).slice(0, 3);
  const solutions = (await getSolutions()).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="hero full-bleed">
        <div className="container hero-inner">
          <h1 className="hero-title">
            x<span style={{ color: 'var(--color-primary)' }}>FUSION</span>
          </h1>
          <p className="hero-lead">
            Got a challenge to solve? A solution to share? xFUSION connects real-world needs with
            unexpected solutions — turning cross-industry innovation into a structured, repeatable process.
          </p>
          <Link href="/explore" className="btn btn-primary">Get Started</Link>
        </div>
      </section>

      {/* About */}
      <section id="about" className="section">
        <div className="section-head">
          <h2 className="h2">About <span className="accent">Us</span></h2>
          <Link href="/explore" className="btn btn-primary btn-sm">Explore ↗</Link>
        </div>
        <div className="grid-3">
          {ABOUT.map((a) => (
            <article key={a.n} className="card about-card">
              <span className="numtag" style={{ background: a.color }}>{a.n}</span>
              <h3 className="card-title">{a.title}</h3>
              <p className="muted">{a.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section">
        <h2 className="h2 center">Main <span className="accent">Features</span></h2>
        <div className="grid-3">
          {FEATURES.map(([title, body, bar, tint]) => (
            <article key={title} className="flex rounded-[var(--radius-4)] overflow-hidden" style={{ background: tint }}>
              <span className="w-[6px] shrink-0" style={{ background: bar }} />
              <div className="p-[var(--spacing-24)] flex flex-col gap-[var(--spacing-10)]">
                <span className="w-[38px] h-[38px] rounded-[var(--radius-4)] flex items-center justify-center" style={{ color: bar, border: `1.5px dashed ${bar}` }} aria-hidden="true">✦</span>
                <h3 className="card-title">{title}</h3>
                <p className="muted">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Featured challenges — real data */}
      <section id="challenges" className="section">
        <div className="section-head">
          <h2 className="h2">Featured <span style={{ color: 'var(--color-orange-1)' }}>Challenges</span></h2>
          <Link href="/challenges" className="muted">View all →</Link>
        </div>
        <div className="grid-3">
          {challenges.map((c) => <ChallengeCard key={c.id} c={c} />)}
        </div>
      </section>

      {/* Featured solutions — real data */}
      <section id="solutions" className="section">
        <div className="section-head">
          <h2 className="h2">Featured <span style={{ color: 'var(--color-green-1)' }}>Solutions</span></h2>
          <Link href="/solutions" className="muted">View all →</Link>
        </div>
        <div className="grid-3">
          {solutions.map((s) => <SolutionCard key={s.id} s={s} />)}
        </div>
      </section>

      {/* Why */}
      <section id="why" className="section">
        <h2 className="h2 center">Why Do You Need xFUSION?</h2>
        <div className="grid-3">
          {STATS.map(([n, label, body, colour]) => (
            <article key={n + label} className="flex rounded-[var(--radius-4)] overflow-hidden bg-[var(--color-grey-white)] border border-solid border-[var(--color-grey-2)]">
              <span className="w-[6px] shrink-0" style={{ background: colour }} />
              <div className="flex flex-col flex-1">
                <div className="p-[var(--spacing-20)] flex flex-col gap-[var(--spacing-4)]" style={{ background: colour }}>
                  <span className="text-[length:var(--font-size-32)] font-[var(--font-weight-bold)] leading-[var(--line-height-100)] text-[var(--color-grey-white)]">{n}</span>
                  <span className="text-[length:var(--font-size-16)] text-[var(--color-grey-white)]">{label}</span>
                </div>
                <p className="muted p-[var(--spacing-20)]">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="section">
        <h2 className="h2 center">How It <span className="accent">Works</span></h2>
        <div className="grid-2">
          {HOW.map((track) => (
            <div key={track.head}>
              <h3 className="card-title" style={{ fontSize: 20 }}>{track.head}</h3>
              <p className="muted" style={{ marginBottom: 20 }}>{track.sub}</p>
              <ol className="steps">
                {track.steps.map(([t, b], i) => (
                  <li key={t} className="card step">
                    <span className="numtag numtag-sm">{i + 1}</span>
                    <div>
                      <h4 className="card-title">{t}</h4>
                      <p className="muted">{b}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="section">
        <h2 className="h2 center">Contact <span className="accent">Us</span></h2>
        <div className="grid gap-[var(--spacing-40)] lg:grid-cols-2 items-start max-w-[960px] mx-auto">
          <div className="flex flex-col gap-[var(--spacing-20)]">
            <p className="text-[length:var(--font-size-16)] leading-[var(--line-height-150)]">
              Ready to turn challenges or solutions into real opportunities?{' '}
              <strong>Fill out this form and we&apos;ll help you get started.</strong>
            </p>
            <a href="tel:+972528523131" className="text-[length:var(--font-size-16)]">📞 +972-528-523131</a>
            <a href="mailto:oranit@xfusion.pro" className="text-[length:var(--font-size-16)]">✉️ oranit@xfusion.pro</a>
          </div>
          {/* Form is visual-only — there's no backend to receive it (HANDOFF.md). */}
          <form className="flex flex-col gap-[var(--spacing-12)]" aria-label="Contact form (not wired up)">
            <input placeholder="Enter your full name" disabled className="h-[48px] px-[var(--spacing-16)] rounded-[var(--radius-4)] border border-solid border-[var(--color-border-input)] bg-[var(--color-grey-white)] text-[length:var(--font-size-16)]" />
            <input placeholder="Enter your email" disabled className="h-[48px] px-[var(--spacing-16)] rounded-[var(--radius-4)] border border-solid border-[var(--color-border-input)] bg-[var(--color-grey-white)] text-[length:var(--font-size-16)]" />
            <textarea placeholder="Enter your message (optional)" disabled className="min-h-[120px] p-[var(--spacing-16)] rounded-[var(--radius-4)] border border-solid border-[var(--color-border-input)] bg-[var(--color-grey-white)] text-[length:var(--font-size-16)] resize-none" />
            <span className="w-fit self-end flex items-center gap-[var(--spacing-10)] h-[48px] px-[var(--spacing-32)] rounded-[var(--radius-40)] text-[var(--color-grey-white)]" style={{ background: 'var(--gradient-primary)' }} title="Form isn't wired up yet">
              Submit ✈
            </span>
          </form>
        </div>
      </section>
    </>
  );
}
