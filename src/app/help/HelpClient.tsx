// app/help/HelpClient.tsx
"use client";

import { useMemo, useState } from "react";

const CREEK_RED = "#b10015";
const CREEK_NAVY = "#0f2741";

type Article = {
  id: string;
  title: string;
  category: "Claims" | "Items" | "Account" | "Policies";
  body: React.ReactNode;
  keywords?: string[];
};

const ARTICLES: Article[] = [
  {
    id: "start-claim",
    title: "How do I start a claim for an item?",
    category: "Claims",
    body: (
      <ol className="list-decimal pl-5 space-y-1">
        <li>
          Open the item’s page and click <strong>Start claim</strong>.
        </li>
        <li>Use your school email and add a proof photo or description.</li>
        <li>Staff will message you with approval or follow-up.</li>
      </ol>
    ),
  },
  {
    id: "pickup",
    title: "Where and when do I pick up items?",
    category: "Claims",
    body: (
      <p>
        Once approved, you’ll get a <strong>pickup code</strong>. Bring it and
        your ID to the school’s front desk or Lost & Found room during hours.
      </p>
    ),
  },
  {
    id: "found-item",
    title: "How do I report a found item?",
    category: "Items",
    body: (
      <ol className="list-decimal pl-5 space-y-1">
        <li>
          Click <strong>Report a found item</strong> on the homepage.
        </li>
        <li>Describe it clearly and include a photo if possible.</li>
        <li>Staff will review and post it once verified.</li>
      </ol>
    ),
  },
];

export default function HelpClient() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | Article["category"]>("All");

  const categories = useMemo(
    () =>
      (["All"] as const).concat(
        Array.from(new Set(ARTICLES.map((a) => a.category))) as any
      ),
    []
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return ARTICLES.filter((a) => {
      const inCat = category === "All" || a.category === category;
      if (!q) return inCat;
      const hay = `${a.title} ${a.category}`.toLowerCase();
      return inCat && hay.includes(q);
    });
  }, [query, category]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10" aria-labelledby="help-title">
      {/* Hero */}
      <header
        className="rounded-3xl border text-white shadow-sm"
        style={{ background: CREEK_NAVY }}
      >
        <div className="p-8">
          <h1
            id="help-title"
            className="text-3xl font-extrabold tracking-tight"
          >
            Help Center
          </h1>
          <p className="mt-2 max-w-3xl text-white/90">
            Find answers to common questions, search articles, or contact staff
            for help.
          </p>

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative w-full md:max-w-lg">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
                🔍
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full rounded-xl border border-white/20 bg-white/10 px-9 py-2.5 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-white"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c as any)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    category === c
                      ? "text-white"
                      : "bg-white text-gray-800 hover:bg-gray-50"
                  }`}
                  style={{
                    borderColor: category === c ? "transparent" : "#e5e7eb",
                    background: category === c ? CREEK_RED : undefined,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div
          style={{ background: CREEK_RED }}
          className="h-1 w-full rounded-b-3xl"
        />
      </header>

      {/* Articles */}
      <section className="mt-8 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-700">
            <div className="text-lg font-semibold">No results</div>
            <p className="mt-1">Try a different keyword or category.</p>
          </div>
        ) : (
          filtered.map((a) => (
            <article
              key={a.id}
              className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  <span
                    className="mr-2 inline-block h-4 w-1.5 rounded-full align-middle"
                    style={{ background: CREEK_RED }}
                    aria-hidden
                  />
                  {a.title}
                </h2>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                  {a.category}
                </span>
              </header>
              <div className="mt-3 text-gray-800">{a.body}</div>
            </article>
          ))
        )}
      </section>

      {/* Footer Feedback */}
      <section
        className="mt-10 rounded-3xl border p-6"
        style={{ borderColor: CREEK_RED, background: "#fff5f5" }}
      >
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: CREEK_NAVY }}>
              Need more help?
            </h2>
            <p className="mt-1 text-gray-700">
              Message staff in <strong>Messages</strong> or email us anytime.
            </p>
          </div>
          <a
            href="mailto:lostfound@cherrycreekschools.org?subject=Help%20request"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white shadow"
            style={{ background: CREEK_RED }}
          >
            Email Support
          </a>
        </div>
      </section>
    </main>
  );
}
