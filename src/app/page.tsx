// src/app/page.tsx
// ------------------------------------------------------
// 🏠 Home Page — Cherry Creek High School Lost & Found
// ------------------------------------------------------
// Full-width hero section (like a modern landing page)
// + "Our Mission" section
// + dynamic recent items from Supabase
// ------------------------------------------------------

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ItemCard } from "@/components/ItemCard";
import { supabase } from "@/lib/supabaseClient";

type CardItem = {
  id: string;
  title: string;
  location: string;
  category: string;
  date: string;
  thumb: string;
};

const BUCKET = "item-photos";
const FALLBACK_THUMB = "/no-image.png";

const CATEGORY_OPTIONS = [
  "All",
  "Clothing",
  "Electronics",
  "Accessories",
  "Bags",
  "Books",
  "Keys",
  "IDs / Cards",
  "Misc",
];

export default function HomePage() {
  const [items, setItems] = useState<CardItem[]>([]);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .schema("public")
        .from("items")
        .select(
          "id, title, location_found, category, date_found, photo_url, status"
        )
        .order("date_found", { ascending: false })
        .limit(12);

      if (error) {
        setErrMsg(error.message);
        return;
      }

      const mapped: CardItem[] = (data ?? []).map((row: any) => {
        let thumb = FALLBACK_THUMB;
        const path: string | null = row.photo_url ?? null;

        if (path) {
          if (/^https?:\/\//i.test(path)) {
            thumb = path;
          } else {
            const { data: urlData } = supabase.storage
              .from(BUCKET)
              .getPublicUrl(path);
            thumb = urlData?.publicUrl || FALLBACK_THUMB;
          }
        }

        return {
          id: String(row.id),
          title: String(row.title ?? "Untitled"),
          location: String(row.location_found ?? "—"),
          category: String(row.category ?? "Misc"),
          date: new Date(row.date_found).toISOString().slice(0, 10),
          thumb,
        };
      });

      setItems(mapped);
      setErrMsg(null);
    })();
  }, []);

  const hasItems = items.length > 0;

  return (
    <>
      {/* ------------------------------------------------------
          🌄 FULL-WIDTH HERO
          ------------------------------------------------------ */}
      <section className="relative w-full h-[650px] overflow-hidden">
        {/* Background image fills the full viewport width */}
        <img
          src="/images/backpack-bench.jpg"
          alt="A backpack left on a school bench"
          className="absolute inset-0 h-full w-full object-cover brightness-80"
        />

        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

        {/* Centered content container */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between px-6 sm:px-12 lg:px-20 py-20 md:py-28 text-white">
          {/* Left: main text */}
          <div className="max-w-xl mb-8 md:mb-0">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
              Lost &amp; Found made easy
            </h1>
            <p className="mt-3 text-base sm:text-lg text-white/90">
              Find or return lost items at Cherry Creek High School — quick,
              simple, and secure.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/report"
                className="btn bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-semibold rounded-lg shadow-md transition"
              >
                Report Found Item
              </Link>
              <Link
                href="/search"
                className="btn border border-white/70 text-white hover:bg-white/10 px-5 py-2.5 text-sm font-semibold rounded-lg transition"
              >
                Browse Items
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------
          ⚠️ Error message (if any)
          ------------------------------------------------------ */}
      {errMsg && (
        <div className="mb-4 mx-auto max-w-7xl rounded-lg border border-red-600/40 bg-red-900/10 p-3 text-sm text-red-400">
          Supabase error: {errMsg}
        </div>
      )}
      {/* 🌟 OUR MISSION (polished) */}
      <section
        aria-labelledby="mission-title"
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16"
      >
        {/* background tint + decorative gradient blob */}
        <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950" />
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[360px] w-[720px] rounded-full bg-blue-500/10 blur-3xl" />

        <div className="grid items-center gap-10 md:grid-cols-2">
          {/* Left: title + copy */}
          <div className="text-center md:text-left">
            <h2
              id="mission-title"
              className="text-3xl font-bold tracking-tight"
            >
              Our Mission
            </h2>

            {/* accent underline */}
            <div className="mx-auto md:mx-0 mt-2 h-1 w-24 rounded-full bg-blue-600/70 dark:bg-blue-400/80" />

            <p className="mt-6 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              The Cherry Creek Lost &amp; Found project helps students and staff
              reunite with their belongings quickly and safely. By combining
              community cooperation with simple, reliable technology, we reduce
              stress, waste, and time spent searching — one backpack at a time.
            </p>

            {/* feature chips */}
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: "⚡",
                  title: "Fast",
                  desc: "Report or search in seconds.",
                },
                { icon: "✅", title: "Fair", desc: "Clear, verified claims." },
                { icon: "🔐", title: "Secure", desc: "Photos & records safe." },
              ].map((f) => (
                <li
                  key={f.title}
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-center shadow-sm transition hover:shadow-md"
                >
                  <div className="text-2xl">{f.icon}</div>
                  <div className="mt-2 font-semibold">{f.title}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {f.desc}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: photo/illustration card (optional) */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-2 shadow-md">
              <img
                src="/images/mission-collage.jpg" // add any relevant image, or reuse your hero cropped
                alt="Students reuniting with a backpack at the office"
                className="h-72 w-full rounded-xl object-cover"
              />
            </div>
            {/* small caption */}
            <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
              Pickup: Main Office • Mon–Fri, 7:30a–3:30p
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------
          📋 Recently Reported Items
          ------------------------------------------------------ */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {hasItems ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recently Reported</h2>
              <Link href="/search" className="text-sm underline">
                View all
              </Link>
            </div>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((it) => (
                <li key={it.id}>
                  <ItemCard item={it} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <section className="grid place-items-center rounded-2xl border border-dashed border-gray-300 py-20 dark:border-gray-700">
            <div className="text-center">
              <p className="text-lg font-medium">No items yet</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Be the first to add a found item so we can get it back to its
                owner.
              </p>
              <Link href="/report" className="btn mt-4">
                Report an Item
              </Link>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
