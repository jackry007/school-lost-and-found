// app/terms/page.tsx

export const metadata = {
  title: "Terms of Service | Creek Lost & Found",
  description:
    "Terms of Service for the Creek Lost & Found student project (FBLA demonstration site).",
  robots: { index: false, follow: false },
};

const CREEK_RED = "#b10015";
const CREEK_NAVY = "#0f2741";

export default function TermsPage() {
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
              📜
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Terms of Service
              </h1>
              <p className="mt-1 text-white/85">
                Please read these terms before using this demonstration site.
              </p>
            </div>
          </div>
        </div>
        <div className="h-1 w-full" style={{ background: CREEK_RED }} />
      </header>

      {/* DISCLAIMER CALLOUT */}
      <div
        role="note"
        aria-label="Project disclaimer"
        className="mt-6 rounded-2xl border shadow-sm"
        style={{ borderColor: CREEK_RED, background: "#fff7f7" }}
      >
        <div className="flex items-start gap-3 p-4">
          <span aria-hidden className="mt-0.5 inline-block text-2xl">
            ⚠️
          </span>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Student Project (FBLA Demonstration)
            </h2>
            <p className="mt-1 text-sm text-gray-800">
              This website is a{" "}
              <strong>
                mock project built for the FBLA Website Coding &amp; Development
                competition (2025–2026)
              </strong>
              . It is <strong>not</strong> an official Cherry Creek Schools
              website and is provided solely for educational demonstration. No
              real services are being offered.
            </p>
          </div>
        </div>
      </div>

      {/* LAYOUT: CONTENT + SIDEBAR TOC */}
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_18rem]">
        {/* MAIN CONTENT */}
        <section className="space-y-6">
          <Card>
            <Section id="acceptance" title="1) Acceptance of Terms">
              <p>
                By accessing or using this site, you agree to these Terms of
                Service. If you do not agree, do not use the site. Because this
                is a student demonstration, these terms serve only as an example
                and <strong>are not legally binding</strong>.
              </p>
            </Section>
          </Card>

          <Card>
            <Section id="demo" title="2) Educational / Demo Nature">
              <p>
                This site simulates a school lost-and-found workflow for FBLA
                evaluation. Listings, submissions, accounts, and messages may be
                fictional or anonymized. Functionality may be limited, unstable,
                or reset without notice.
              </p>
            </Section>
          </Card>

          <Card>
            <Section id="privacy" title="3) Privacy & Data">
              <p>
                Do not submit real personal information. Any data entered is
                treated as sample/demo data and may be deleted at any time. For
                more context, see the{" "}
                <a className="link" href="/privacy">
                  Privacy &amp; Notices
                </a>{" "}
                page.
              </p>
            </Section>
          </Card>

          <Card>
            <Section id="acceptable-use" title="4) Acceptable Use">
              <ul className="list-outside list-disc pl-5">
                <li>
                  Do not upload offensive, illegal, or copyrighted content you
                  do not own.
                </li>
                <li>
                  Do not attempt to breach, disrupt, or misuse the service.
                </li>
                <li>
                  Do not impersonate real individuals or post sensitive personal
                  data.
                </li>
              </ul>
            </Section>
          </Card>

          <Card>
            <Section id="ownership" title="5) Content & Ownership">
              <p>
                Student-authored code and UI are part of an educational
                portfolio project. Images and text used for demonstration should
                be original, license-compliant, or placeholders. If you believe
                content infringes your rights, contact (demo){" "}
                <a
                  className="link"
                  href="mailto:lostfound@cherrycreekschools.org"
                >
                  lostfound@cherrycreekschools.org
                </a>
                .
              </p>
            </Section>
          </Card>

          <Card>
            <Section id="warranty" title="6) No Warranty">
              <p>
                The site is provided “as-is” without warranties of any kind,
                including accuracy, availability, security, or fitness for a
                particular purpose. Features may change or break at any time.
              </p>
            </Section>
          </Card>

          <Card>
            <Section id="liability" title="7) Limitation of Liability">
              <p>
                To the maximum extent permitted by law, the student developers,
                school, advisors, and related parties shall not be liable for
                any damages arising from or related to your use of this
                demonstration site.
              </p>
            </Section>
          </Card>

          <Card>
            <Section id="mods" title="8) Modifications">
              <p>
                These terms may be updated for clarity or instructional purposes
                without notice. The “Last updated” date below reflects the most
                recent revision.
              </p>
            </Section>
          </Card>

          <Card>
            <Section id="contact" title="9) Contact (Demo)">
              <p>
                Email{" "}
                <a
                  className="link"
                  href="mailto:lostfound@cherrycreekschools.org"
                >
                  lostfound@cherrycreekschools.org
                </a>{" "}
                for questions about this educational project.
              </p>
              <p className="mt-4 text-sm text-gray-500">
                Last updated: {updated}
              </p>
            </Section>
          </Card>

          {/* CTA CARD */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Need more details?
                </h3>
                <p className="text-sm text-gray-600">
                  Visit our{" "}
                  <a className="link" href="/help">
                    Help Center
                  </a>{" "}
                  or{" "}
                  <a className="link" href="/contact">
                    Contact
                  </a>{" "}
                  page.
                </p>
              </div>
              <a
                href="/privacy"
                className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm"
                style={{
                  color: CREEK_NAVY,
                  borderColor: CREEK_NAVY,
                  background: "#f1f5fb",
                }}
              >
                View Privacy & Notices →
              </a>
            </div>
          </div>
        </section>

        {/* SIDEBAR TOC (desktop only) */}
        <aside className="hidden md:block">
          <nav className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">
              On this page
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <TocLink href="#acceptance" label="Acceptance of Terms" />
              <TocLink href="#demo" label="Educational / Demo Nature" />
              <TocLink href="#privacy" label="Privacy & Data" />
              <TocLink href="#acceptable-use" label="Acceptable Use" />
              <TocLink href="#ownership" label="Content & Ownership" />
              <TocLink href="#warranty" label="No Warranty" />
              <TocLink href="#liability" label="Limitation of Liability" />
              <TocLink href="#mods" label="Modifications" />
              <TocLink href="#contact" label="Contact (Demo)" />
            </ul>
          </nav>
        </aside>
      </div>

      {/* FOOTER NOTE */}
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
