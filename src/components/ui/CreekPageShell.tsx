// src/components/ui/CreekPageShell.tsx
"use client";

export function CreekPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #0B2C5C0A 0%, #0B2C5C08 40%, #ffffff 100%)",
        backgroundImage:
          "radial-gradient(rgba(11,44,92,0.06) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
        backgroundAttachment: "scroll",
      }}
    >
      {children}
    </div>
  );
}
