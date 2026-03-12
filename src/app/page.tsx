// src/app/page.tsx
// ------------------------------------------------------
// Cherry Creek HS Lost & Found — Homepage
// - Hero + Mission + (Stats PUBLIC) + Testimonials + Stories
// - Recently Reported section is AUTH-gated
// - Public stats visible to everyone
// ------------------------------------------------------

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BASE } from "@/lib/basePath";
import { supabase } from "@/lib/supabaseClient";
import { useAuthUI } from "@/components/AuthUIProvider";

import {
  CREEK_RED,
  CREEK_NAVY,
  PHOTO_BUCKET,
  FALLBACK_ITEM_IMAGE,
} from "@/lib/brand";
import { STORIES, TESTIMONIALS } from "@/lib/homeContent";

import { CreekPageShell } from "@/components/ui/CreekPageShell";
import { CreekRibbon } from "@/components/ui/CreekRibbon";

import { HeroSection } from "@/components/home/HeroSection";
import { MissionSection } from "@/components/home/MissionSection";
import { StatsSection, type LiveStats } from "@/components/home/StatsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { StoriesSection } from "@/components/home/StoriesSection";
import {
  RecentItemsSection,
  type RecentCardItem,
} from "@/components/home/RecentItemsSection";

/* ---------- Supabase row type ---------- */
type PublicStatsRow = {
  total_items: number | null;
  claimed: number | null;
  recent: number | null;
  claim_rate: number | null;
};

export default function HomePage() {
  const router = useRouter();
  const { openPanel } = useAuthUI();

  // Auth
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Errors + data
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [items, setItems] = useState<RecentCardItem[]>([]);

  // Public program stats (for everyone)
  const [stats, setStats] = useState<LiveStats>({
    totalItems: 0,
    claimed: 0,
    recent: 0,
    claimRate: 0,
  });

  const goProtected = (href: string) => {
    if (authLoading) return;
    if (user) router.push(href);
    else openPanel(href);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, []);

  /* ---------- Auth bootstrap + subscribe ---------- */
  useEffect(() => {
    let mounted = true;

    async function bootstrapAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) {
          console.error("auth.getSession error:", error.message);
          setUser(null);
        } else {
          setUser(data.session?.user ?? null);
        }
      } catch (e: any) {
        if (!mounted) return;
        console.error("auth bootstrap failed:", e?.message ?? e);
        setUser(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }

    void bootstrapAuth();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  /* ---------- PUBLIC stats (no login required) ---------- */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("public_program_stats")
          .select("*")
          .single();

        if (error) throw error;

        const row = (data as PublicStatsRow) ?? null;
        if (!alive) return;

        setStats({
          totalItems: row?.total_items ?? 0,
          claimed: row?.claimed ?? 0,
          recent: row?.recent ?? 0,
          claimRate: row?.claim_rate ?? 0,
        });
      } catch (e: any) {
        console.error("Public stats fetch failed:", e?.message ?? e);
        if (!alive) return;
        setStats({ totalItems: 0, claimed: 0, recent: 0, claimRate: 0 });
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  /* ---------- Recent items (AUTH only) ---------- */
  useEffect(() => {
    let alive = true;

    if (authLoading) return;

    if (!user) {
      setItems([]);
      setErrMsg(null);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from("items")
        .select("id, title, location, category, date_found, photo_url, status")
        .eq("status", "listed")
        .order("date_found", { ascending: false })
        .limit(8);

      if (!alive) return;

      if (error) {
        setErrMsg(error.message);
        return;
      }

      const mapped: RecentCardItem[] = (data ?? []).map((row: any) => {
        let thumb = `${BASE}${FALLBACK_ITEM_IMAGE}`;
        const path: string | null = row.photo_url ?? null;

        if (path) {
          if (/^https?:\/\//i.test(path)) {
            thumb = path;
          } else {
            const { data: urlData } = supabase.storage
              .from(PHOTO_BUCKET)
              .getPublicUrl(path);

            thumb = urlData?.publicUrl || thumb;
          }
        }

        return {
          id: String(row.id),
          title: String(row.title ?? "Untitled"),
          location: String(row.location ?? "—"),
          category: String(row.category ?? "Misc"),
          date: new Date(row.date_found).toISOString().slice(0, 10),
          thumb,
        };
      });

      setItems(mapped);
      setErrMsg(null);
    })();

    return () => {
      alive = false;
    };
  }, [user, authLoading]);
  return (
    <CreekPageShell>
      <HeroSection
        base={BASE}
        creekRed={CREEK_RED}
        creekNavy={CREEK_NAVY}
        authLoading={authLoading}
        isAuthed={!!user}
        onReport={() => goProtected("/report")}
        onBrowse={() => goProtected("/search")}
      />

      <CreekRibbon creekRed={CREEK_RED} creekNavy={CREEK_NAVY} />

      {errMsg && (
        <div className="mx-auto my-4 max-w-7xl rounded-lg border border-red-500/30 bg-red-50 p-3 text-sm text-red-700">
          Supabase error: {errMsg}
        </div>
      )}

      {/* Sections */}
      <MissionSection base={BASE} creekRed={CREEK_RED} creekNavy={CREEK_NAVY} />

      <StatsSection stats={stats} creekRed={CREEK_RED} creekNavy={CREEK_NAVY} />

      <TestimonialsSection
        testimonials={TESTIMONIALS}
        creekRed={CREEK_RED}
        creekNavy={CREEK_NAVY}
      />

      <StoriesSection
        stories={STORIES}
        goProtected={goProtected}
        creekRed={CREEK_RED}
        creekNavy={CREEK_NAVY}
      />

      <RecentItemsSection
        authLoading={authLoading}
        isAuthed={!!user}
        items={items}
        creekRed={CREEK_RED}
        creekNavy={CREEK_NAVY}
        onSignIn={() => openPanel()}
        onViewAll={() => goProtected("/search")}
        onReport={() => goProtected("/report")}
      />
    </CreekPageShell>
  );
}
