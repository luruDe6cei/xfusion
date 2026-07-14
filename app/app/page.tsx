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

const FEATURES = [
  ['AI-Driven Matching', 'Our AI matches challenges with best-fit solutions across sectors, accelerating discovery and enabling faster, higher-quality collaborations.'],
  ['Cross-Industry Collaboration', 'Access a global library of proven solutions, enabling the use of innovations from various industries to solve complex challenges and foster creative synergy.'],
  ['Privacy & Security', 'Collaborate within a secure, interactive environment that protects intellectual property and supports trust between partners, with strict privacy controls.'],
  ['Full Workflow Integration', 'Manage solutions from submission to implementation seamlessly, with tools that facilitate ongoing communication and provide detailed analytics at every stage.'],
  ['Sustainable Knowledge Repository', 'Unmatched solutions are retained in a Solution Bank for future challenges, creating a sustainable knowledge base and increasing the likelihood of future matches.'],
  ['API Integration', 'An API designed for handling large data sets, tailored for use by TTOs, universities, and research organizations, enhancing access and collaboration.'],
];

const STATS = [
  ['30%', 'Increase in R&D Cost Efficiency', 'Cross-industry innovation at xFUSION leads to more efficient research and development, reducing costs by repurposing technologies from diverse fields.'],
  ['40%', 'Much Faster Time-to-Market', 'Our collaborative process accelerates the path from idea to implementation, enabling faster product launches and reducing time-to-market by up to 40%.'],
  ['10%', 'Improvement in Solution Ideation & Validation', 'By leveraging cross-disciplinary expertise, xFUSION delivers validated solutions that address complex challenges more effectively.'],
  ['50%', 'Reduction in Discovery Time', 'AI-driven matching surfaces relevant solutions in a fraction of the time manual scouting takes.'],
  ['5x', 'More Relevant Matches', 'Matching across industries widens the pool of viable solutions well beyond a single sector.'],
  ['100+', 'Organizations & Innovators', 'A growing marketplace of enterprises, startups, research bodies, and public institutions.'],
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
          {FEATURES.map(([title, body]) => (
            <article key={title} className="card">
              <h3 className="card-title">{title}</h3>
              <p className="muted">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Featured challenges — real data */}
      <section id="challenges" className="section">
        <div className="section-head">
          <h2 className="h2">Featured <span className="accent">Challenges</span></h2>
          <Link href="/challenges" className="muted">View all →</Link>
        </div>
        <div className="grid-3">
          {challenges.map((c) => <ChallengeCard key={c.id} c={c} />)}
        </div>
      </section>

      {/* Featured solutions — real data */}
      <section id="solutions" className="section">
        <div className="section-head">
          <h2 className="h2">Featured <span className="accent">Solutions</span></h2>
          <Link href="/solutions" className="muted">View all →</Link>
        </div>
        <div className="grid-3">
          {solutions.map((s) => <SolutionCard key={s.id} s={s} />)}
        </div>
      </section>

      {/* Why */}
      <section id="why" className="section">
        <h2 className="h2 center">Why Do You Need <span className="accent">xFUSION?</span></h2>
        <div className="grid-3">
          {STATS.map(([n, label, body]) => (
            <article key={n + label} className="card">
              <div className="stat">{n}</div>
              <h3 className="card-title">{label}</h3>
              <p className="muted">{body}</p>
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
        <div className="contact">
          <a href="tel:+972528523131" className="card contact-card">
            <span className="muted">Phone</span>
            <strong>+972-528-523131</strong>
          </a>
          <a href="mailto:oranit@xfusion.pro" className="card contact-card">
            <span className="muted">Email</span>
            <strong>oranit@xfusion.pro</strong>
          </a>
        </div>
      </section>
    </>
  );
}
