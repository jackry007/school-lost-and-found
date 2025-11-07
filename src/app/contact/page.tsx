// app/contact/page.tsx
export const metadata = {
  title: "Contact | Creek Lost & Found",
  description:
    "Contact Creek Lost & Found. Reach us by phone, email, or visit the front desk for assistance.",
};

const CREEK_RED = "#b10015";
const CREEK_NAVY = "#0f2741";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      {/* Hero Banner */}
      <header
        className="rounded-3xl border text-white shadow-sm"
        style={{ background: CREEK_NAVY }}
      >
        <div className="p-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Contact Creek Lost &amp; Found
          </h1>
          <p className="mt-2 max-w-2xl text-white/90">
            Need help with a lost or found item? We’re here to help.
          </p>
        </div>
        <div
          style={{ background: CREEK_RED }}
          className="h-1 w-full rounded-b-3xl"
        />
      </header>

      {/* Main content */}
      <section className="mt-8 space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            📞 Call or Visit Us
          </h2>
          <p className="mt-2 text-gray-700">
            You can reach the Lost &amp; Found desk during school hours.
          </p>

          <dl className="mt-4 space-y-2 text-gray-800">
            <div>
              <dt className="font-medium">Phone:</dt>
              <dd className="text-lg font-semibold tracking-wide">
                (720) 567-6346
              </dd>
            </div>
            <div>
              <dt className="font-medium">Location:</dt>
              <dd>Cherry Creek High School Front Desk – East Building</dd>
            </div>
            <div>
              <dt className="font-medium">Hours:</dt>
              <dd>Monday–Friday, 8:00 AM – 3:30 PM (school days)</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">📧 Email</h2>
          <p className="mt-2 text-gray-700">
            Send us an email with your name, item description, and any
            identifying details. We usually reply within one school day.
          </p>
          <a
            href="mailto:lostfound@cherrycreekschools.org"
            className="mt-3 inline-block rounded-full bg-[#b10015] px-5 py-2 text-sm font-medium text-white shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#b10015]"
          >
            lostfound@cherrycreekschools.org
          </a>
        </div>

        <div
          className="rounded-3xl border p-6 text-center"
          style={{ borderColor: CREEK_RED, background: "#fff5f5" }}
        >
          <h2 className="text-lg font-semibold text-gray-900">💡 Quick Tip</h2>
          <p className="mt-1 text-gray-700">
            If you reported or claimed an item, check your{" "}
            <a
              className="font-medium underline decoration-[#b10015]/40 underline-offset-4"
            >
              Messages
            </a>{" "}
            page for updates from staff.
          </p>
        </div>
      </section>
    </main>
  );
}
