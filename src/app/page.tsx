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
          A private dashboard for accounts, cash flow, category spending, and budget targets.
        </p>
        <div className="flex gap-3">
          <Link className="button" href="/login">
            Sign in to portal
          </Link>
        </div>
      </section>
      <section className="feature-grid">
        <div>
          <strong>Private by design</strong>
          <p>Secure, authenticated financial management.</p>
        </div>
        <div>
          <strong>Shared clarity</strong>
          <p>Accounts, activity, and budgets in one view.</p>
        </div>
        <div>
          <strong>Actionable insights</strong>
          <p>Track cash flow, net worth, and category progress in real time.</p>
        </div>
      </section>
    </main>
  );
}
