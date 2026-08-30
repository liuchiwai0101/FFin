import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <nav>
        <span className="brand">Family Finance</span>
        <Link href="/login">Sign in</Link>
      </nav>
      <section className="hero">
        <p className="eyebrow">Personal &amp; Family Wealth</p>
        <h1>See the full picture. Plan the next chapter.</h1>
        <p className="hero-copy">
          Sign in, upload your bank interest Excel sheet, and browse current products and history — no database required.
        </p>
        <div className="flex gap-3">
          <Link className="button" href="/login">
            Sign in to portal
          </Link>
        </div>
      </section>
      <section className="feature-grid">
        <div>
          <strong>Excel-driven</strong>
          <p>Upload Summary.xlsx anytime to refresh every table.</p>
        </div>
        <div>
          <strong>No database</strong>
          <p>Dashboard data lives only from your latest upload.</p>
        </div>
      </section>
    </main>
  );
}
