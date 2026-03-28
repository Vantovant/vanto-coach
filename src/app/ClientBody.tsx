"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from 'next/navigation';
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { trackBetaEvent } from '@/lib/supabase/analytics';

function AnalyticsBoot() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const route = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    trackBetaEvent({ eventName: 'page_view', route });
  }, [pathname, searchParams]);

  return null;
}

export function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.className = "antialiased";
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <Suspense fallback={null}><AnalyticsBoot /></Suspense>
      <div className="antialiased">{children}</div>
      <Toaster position="bottom-right" richColors closeButton />
    </AuthProvider>
  );
}
