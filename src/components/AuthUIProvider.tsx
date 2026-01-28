"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type AuthUIContextValue = {
  panelOpen: boolean;
  redirectTo: string | null;

  // Open the sign-in panel. Optionally remember where to go after login.
  openPanel: (redirectTo?: string | null) => void;

  // Close the sign-in panel (does NOT clear redirect by default).
  closePanel: () => void;

  // Clear the remembered redirect target.
  clearRedirect: () => void;

  // (Optional) set redirect without opening/closing panel
  setRedirectTo: (href: string | null) => void;
};

const AuthUIContext = createContext<AuthUIContextValue | null>(null);

export function AuthUIProvider({ children }: { children: React.ReactNode }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const value = useMemo<AuthUIContextValue>(
    () => ({
      panelOpen,
      redirectTo,

      openPanel: (to?: string | null) => {
        if (typeof to === "string") setRedirectTo(to);
        setPanelOpen(true);
      },

      closePanel: () => setPanelOpen(false),

      clearRedirect: () => setRedirectTo(null),

      setRedirectTo,
    }),
    [panelOpen, redirectTo],
  );

  return (
    <AuthUIContext.Provider value={value}>{children}</AuthUIContext.Provider>
  );
}

export function useAuthUI() {
  const ctx = useContext(AuthUIContext);
  if (!ctx) throw new Error("useAuthUI must be used inside <AuthUIProvider />");
  return ctx;
}
