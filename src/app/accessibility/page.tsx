// app/accessibility/page.tsx
export const metadata = {
  title: "Accessibility | Creek Lost & Found",
  description:
    "Accessibility statement for Creek Lost & Found. Contact us to report barriers or request accommodations.",
};

const CREEK_RED = "#b10015";
const CREEK_NAVY = "#0f2741";

export default function Page() {
  const today = new Date().toLocaleDateString();

  return (
    <main
      role="main"
      className="mx-auto max-w-5xl px-4 py-10"
      aria-labelledby="a11y-title"
    >
      {/* Skip link */}
      <a
        href="#content-start"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-black focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      {/* HERO — solid CCHS navy with thin red underline */}
      <header
        role="banner"
        className="rounded-3xl border text-white shadow-sm"
        style={{ background: CREEK_NAVY, borderColor: CREEK_NAVY }}
      >
        <div className="p-8">
          <h1
            id="a11y-title"
            className="text-3xl font-extrabold tracking-tight"
          >
            Accessibility at Creek Lost &amp; Found
          </h1>
          <p className="mt-2 max-w-3xl text-white/90">
            We’re committed to making our website usable for everyone. If you
            find a barrier, please tell us—there’s a contact section below.
          </p>

          <div className="mt-6">
            <a
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
              href="mailto:lostfound@cherrycreekschools.org?subject=Accessibility%20feedback"
            >
              📨 Report a barrier
            </a>
          </div>
        </div>
        <div
          style={{ background: CREEK_RED }}
          className="h-1 w-full rounded-b-3xl"
        />
      </header>

      <div id="content-start" className="sr-only" />

      {/* TOP ROW */}
      <section
        aria-label="High-level commitments"
        className="mt-8 grid gap-4 md:grid-cols-2"
      >
        <Card title="Our commitment">
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-800">
            <li>Keyboard-only navigation with visible focus states</li>
            <li>Sufficient color contrast and scalable text</li>
            <li>Descriptive labels, instructions, and clear errors</li>
            <li>Text alternatives for non-text content</li>
            <li>Logical headings, landmarks, and reading order</li>
          </ul>
        </Card>

        <Card title="Standards & conformance">
          <p className="text-gray-800">
            We aim for conformance with{" "}
            <a
              className="underline decoration-[3px] decoration-[#b10015]/40 underline-offset-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              href="https://www.w3.org/TR/WCAG22/"
              target="_blank"
              rel="noreferrer"
            >
              WCAG 2.2
            </a>{" "}
            Level AA. We use semantic HTML, ARIA landmarks, and testing via
            axe/Lighthouse, keyboard checks, and screen reader spot-tests.
          </p>
          <dl className="mt-4 grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
            <dt className="text-gray-500">Target level</dt>
            <dd>WCAG 2.2 AA</dd>
            <dt className="text-gray-500">Last updated</dt>
            <dd>{today}</dd>
          </dl>
        </Card>
      </section>

      {/* CONTACT / ACCOMMODATIONS */}
      <section
        aria-label="Contact and accommodations"
        className="mt-8 grid gap-4 md:grid-cols-3"
      >
        <Card title="Report a barrier">
          <p className="text-gray-800">
            Email{" "}
            <a
              className="font-medium underline decoration-[3px] decoration-[#b10015]/40 underline-offset-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              href="mailto:lostfound@cherrycreekschools.org"
            >
              lostfound@cherrycreekschools.org
            </a>{" "}
            with:
          </p>
          <ul className="mt-2 list-disc pl-6 text-gray-800">
            <li>What you tried to do</li>
            <li>What happened</li>
            <li>URL, browser, device, assistive tech (if any)</li>
          </ul>
        </Card>

        <Card title="Accommodations">
          <p className="text-gray-800">
            Need an alternative format or help using the site? We’ll work with
            you to provide a reasonable accommodation.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Typical response: within 2–3 business days.
          </p>
        </Card>

        <Card title="Known limitations">
          <p className="text-gray-800">
            We continuously improve. If you encounter issues with uploaded
            photos or third-party embeds, let us know so we can fix or provide
            an alternative.
          </p>
        </Card>
      </section>

      {/* TECHNICAL DETAILS */}
      <section aria-label="Technical details" className="mt-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Technical details</h2>
          <div className="mt-2 divide-y">
            <A11yDetail
              q="Keyboard support"
              a={
                <>
                  Every interactive control is reachable in order with{" "}
                  <kbd className="rounded border px-1">Tab</kbd>, and shows a
                  visible focus ring. Menus/dialogs support{" "}
                  <kbd className="rounded border px-1">Esc</kbd> to close.
                </>
              }
            />
            <A11yDetail
              q="Color & contrast"
              a="We target ≥4.5:1 for text and ≥3:1 for large text/UI controls."
            />
            <A11yDetail
              q="Forms & errors"
              a="Inputs include labels, hints, and programmatic error messages when validation fails."
            />
            <A11yDetail
              q="Images"
              a="Non-decorative images include descriptive alt text; decorative images use empty alt."
            />
            <A11yDetail
              q="Screen reader structure"
              a="Pages use landmarks (header, nav, main), hierarchical headings, and clear page titles."
            />
          </div>
        </div>
      </section>

      {/* FEEDBACK BAR — subtle red tint, navy text */}
      <aside
        aria-label="Feedback"
        className="mt-10 rounded-3xl border p-6"
        style={{ borderColor: CREEK_RED, background: "#fff5f5" }}
      >
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: CREEK_NAVY }}>
              Help us improve
            </h2>
            <p className="mt-1 max-w-3xl text-gray-700">
              Accessibility is a journey. If something makes the site hard to
              use, even a little, we want to know.
            </p>
          </div>
          <a
            href="mailto:lostfound@cherrycreekschools.org?subject=Accessibility%20feedback"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white shadow focus:outline-none focus:ring-2"
            style={{ background: CREEK_RED }}
          >
            Send feedback
          </a>
        </div>
      </aside>
    </main>
  );
}

/* ---------- Helpers ---------- */

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-3xl border bg-white p-6 shadow-sm"
      aria-labelledby={slugify(title)}
      style={{ borderColor: "#e5e7eb" }}
    >
      <h2 id={slugify(title)} className="text-lg font-semibold">
        <span
          className="mr-2 inline-block h-4 w-1.5 rounded-full align-middle"
          style={{ background: CREEK_RED }}
          aria-hidden
        />
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function A11yDetail({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <details className="group py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span className="font-medium text-gray-900">{q}</span>
        <span className="rounded-full border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs text-gray-700 transition group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="mt-2 text-gray-800">{a}</div>
    </details>
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
