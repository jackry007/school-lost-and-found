// app/privacy/page.tsx

export const metadata = {
  title: "Privacy & Notices | Creek Lost & Found",
  description:
    "Privacy, accessibility, and FBLA documentation for the Creek Lost & Found student project.",
  robots: { index: false, follow: false },
};

const CREEK_RED = "#b10015";
const CREEK_NAVY = "#0f2741";

export default function PrivacyNoticesPage() {
  const updated = new Date().toLocaleDateString();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      {/* Disclaimer */}
      <div
        role="note"
        aria-label="Project disclaimer"
        className="mb-6 rounded-2xl border shadow-sm"
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
              . It is{" "}
              <strong>not an official Cherry Creek Schools website</strong> and
              is not monitored in real time. Any privacy information here is
              fictional and shown for demonstration purposes only.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <header
        className="rounded-3xl border text-white shadow-sm"
        style={{ background: CREEK_NAVY }}
      >
        <div className="p-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Privacy &amp; Program Notices
          </h1>
          <p className="mt-2 max-w-2xl text-white/90">
            Learn about this project’s privacy demonstration and the FBLA event
            guidelines that inspired it.
          </p>
        </div>
        <div
          style={{ background: CREEK_RED }}
          className="h-1 w-full rounded-b-3xl"
        />
      </header>

      {/* Cards */}
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Privacy (Demo)
          </h2>
          <p className="mt-2 text-gray-700">
            This site stores only example data—like test item descriptions and
            placeholder contact details—to simulate how a lost-and-found system
            could operate. No personal data is used or shared.
          </p>
          <ul className="mt-3 list-disc pl-5 text-gray-800">
            <li>All submissions are mock and can be deleted anytime.</li>
            <li>Images exist only for identification demonstration.</li>
            <li>
              Contact (demo):{" "}
              <a
                href="mailto:lostfound@cherrycreekschools.org"
                className="underline decoration-[#b10015]/40 underline-offset-4"
              >
                lostfound@cherrycreekschools.org
              </a>
            </li>
          </ul>
          <p className="mt-3 text-sm text-gray-500">Last updated: {updated}</p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">FBLA Context</h2>
          <p className="mt-2 text-gray-700">
            This website was developed for the{" "}
            <em>FBLA 2025–2026 Website Coding &amp; Development</em> event:
            <br />
            <strong>“School Lost-and-Found Website.”</strong>
          </p>
          <p className="mt-3 text-sm text-gray-500">
            Event focus: backend coding, accessibility, and clean UI/UX design.
          </p>
        </div>
      </section>

      {/* PDF section */}
      <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          FBLA 2025–2026 Website Coding &amp; Development Guidelines
        </h2>
        <p className="mt-2 text-gray-700">
          You can view or download the official event document directly from
          FBLA Headquarters. It outlines all competition requirements, scoring
          rubrics, and accessibility expectations.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href="https://connect.fbla.org/headquarters/files/High%20School%20Competitive%20Events%20Resources/Individual%20Guidelines/Presentation%20Events/Website-Coding-and-Development.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-[#b10015] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#930011] focus:outline-none focus:ring-2 focus:ring-[#b10015]"
          >
            📄 View or Download PDF
          </a>
          <span className="text-sm text-gray-600">
            Official FBLA guideline document
          </span>
        </div>
      </section>

      {/* Footer note */}
      <footer className="mt-10 border-t pt-6 text-center text-sm text-gray-500">
        <p>
          © {new Date().getFullYear()} Creek Lost &amp; Found (FBLA Project).
          For educational demonstration only.
        </p>
      </footer>
    </main>
  );
}
