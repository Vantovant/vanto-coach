"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

export function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
  }, []);

  return (
    <AuthProvider>
      <div className="antialiased">{children}</div>
      <Toaster position="bottom-right" richColors closeButton />
    </AuthProvider>
  );
}
