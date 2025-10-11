// app/search/page.tsx
import { Suspense } from "react";
import SearchClient from "./search-client"; // default import

export const metadata = { title: "Search Found Items" };

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <SearchClient />
    </Suspense>
  );
}
