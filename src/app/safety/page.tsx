// app/safety/page.tsx

export const metadata = {
  title: "Safety & Reporting | Creek Lost & Found",
  description:
    "How to report concerns, prohibited content, and safety guidelines for the Creek Lost & Found demo site.",
  robots: { index: false, follow: false },
};

const CREEK_RED = "#b10015";
const CREEK_NAVY = "#0f2741";

export default function SafetyPage() {
  const updated = new Date().toLocaleDateString();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* HERO */}
      <header className="rounded-3xl border shadow-sm overflow-hidden">
        <div
          className="px-6 py-8 text-white"
          style={{ background: CREEK_NAVY }}
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-2xl"
            >
              🛡️
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Safety & Reporting
              </h1>
              <p className="mt-1 text-white/85">
                How to report issues and what we do to keep this demo
                environment appropriate.
              </p>
            </div>
          </div>
        </div>
        <div className="h-1 w-full" style={{ background: CREEK_RED }} />
      </header>

      {/* FBLA DEMO DISCLAIMER */}
      <div
        role="note"
        aria-label="Project disclaimer"
        className="mt-6 rounded-2xl border shadow-sm"
        style={{ borderColor: CREEK_RED, background: "#fff7f7" }}
      >
        <div className="flex items-start gap-3 p-4">
          <span aria-hidden className="mt-0.5 inline-block text-2xl">
            📣
          </span>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Student Project (FBLA Demonstration)
            </h2>
            <p className="mt-1 text-sm text-gray-800">
              This website is a{" "}
              <strong>
                mock site for the FBLA Website Coding &amp; Development
                competition (2025–2026)
              </strong>
              . It is <strong>not</strong> an official Cherry Creek Schools
              service. Use sample data only.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_18rem]">
        {/* MAIN CONTENT */}
        <section className="space-y-6">
          <Card>
            <Section id="emergency" title="1) Emergencies">
              <p>
                If you are in immediate danger or reporting a time-sensitive
                safety threat, contact <strong>911</strong> or your local
                authorities. Do not rely on this demo site for emergency
                communication.
              </p>
            </Section>
          </Card>

          <Card>
            <Section id="report" title="2) Report a Concern">
              <p>
                See something inappropriate, impersonation, harassment, or a
                suspicious listing? Please send details:
              </p>
              <ul className="mt-2 list-outside list-disc pl-5">
                <li>Link or ID of the item/claim/message</li>
                <li>What happened and when you saw it</li>
                <li>Screenshots if possible</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm"
                  style={{
                    color: CREEK_NAVY,
                    borderColor: CREEK_NAVY,
                    background: "#f1f5fb",
                  }}
                  href="mailto:lostfound@cherrycreekschools.org?subject=Report%20a%20Concern%20(Creek%20Lost%20%26%20Found%20Demo)"
                >
                  Email: lostfound@cherrycreekschools.org
                </a>
                <a
                  className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm"
                  style={{
                    color: CREEK_NAVY,
                    borderColor: CREEK_NAVY,
                    background: "#f1f5fb",
                  }}
                  href="/contact"
                >
                  Use the Contact page →
                </a>
              </div>
            </Section>
          </Card>

          <Card>
            <Section id="prohibited" title="3) Prohibited Content">
              <ul className="list-outside list-disc pl-5">
                <li>Harassment, threats, hate speech, or bullying</li>
                <li>
                  Personal data (IDs, addresses, phone numbers) of real people
                </li>
                <li>Illegal goods, weapons, drugs, explicit material</li>
                <li>Copyrighted content without permission</li>
                <li>Spam, scams, or fraudulent claims</li>
              </ul>
              <p className="mt-3">
                Violations may be removed and accounts may be blocked in the
                demo environment.
              </p>
            </Section>
          </Card>

          <Card>
            <Section id="conduct" title="4) Student Conduct (Demo)">
              <p>
                Be respectful and professional. Use school-appropriate language
                and images. Remember this is a public demonstration for judges
                and educators.
              </p>
            </Section>
          </Card>

          <Card>
            <Section id="moderation" title="5) Moderation & Escalation (Demo)">
              <ol className="list-outside list-decimal pl-5">
                <li>Report submission received via email or Contact page</li>
                <li>
                  Student moderators review and hide/remove offending content
                </li>
                <li>
                  Repeat or severe issues: block demo account and document
                  action
                </li>
              </ol>
              <p className="mt-3 text-sm text-gray-600">
                Note: This mirrors how moderation could work in production;
                actual school procedures would apply on a real system.
              </p>
            </Section>
          </Card>

          <Card>
            <Section id="privacy" title="6) Data & Privacy Notes">
              <p>
                Do not submit real personal information. Entries may be cleared
                at any time during judging. For details, see{" "}
                <a className="link" href="/privacy">
                  Privacy &amp; Notices
                </a>
                .
              </p>
            </Section>
          </Card>

          <Card>
            <Section id="resources" title="7) Resources (Informational)">
              <ul className="list-outside list-disc pl-5">
                <li>
                  <a className="link" href="/terms">
                    Terms of Service (Demo)
                  </a>
                </li>
                <li>
                  <a className="link" href="/help">
                    Help Center
                  </a>
                </li>
                <li>
                  <a className="link" href="/contact">
                    Contact
                  </a>
                </li>
              </ul>
              <p className="mt-3 text-sm text-gray-500">
                Last updated: {updated}
              </p>
            </Section>
          </Card>
        </section>

        {/* SIDEBAR TOC */}
        <aside className="hidden md:block">
          <nav className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">
              On this page
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <TocLink href="#emergency" label="Emergencies" />
              <TocLink href="#report" label="Report a Concern" />
              <TocLink href="#prohibited" label="Prohibited Content" />
              <TocLink href="#conduct" label="Student Conduct" />
              <TocLink href="#moderation" label="Moderation & Escalation" />
              <TocLink href="#privacy" label="Data & Privacy Notes" />
              <TocLink href="#resources" label="Resources" />
            </ul>
          </nav>
        </aside>
      </div>

      <footer className="mt-10 border-t pt-6 text-center text-sm text-gray-500">
        <p>
          © {new Date().getFullYear()} Creek Lost &amp; Found (FBLA Project).
          For educational demonstration only.
        </p>
      </footer>
    </main>
  );
}

/* ---------- Tiny helpers ---------- */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {children}
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="prose prose-neutral mt-3 max-w-none [&_.link]:underline [&_.link]:decoration-[#b10015]/40 [&_.link]:underline-offset-4">
        {children}
      </div>
    </section>
  );
}

function TocLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a
        href={href}
        className="block rounded-lg px-2 py-1.5 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {label}
      </a>
    </li>
  );
}
