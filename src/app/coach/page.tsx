'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CoachLayout } from '@/components/layout/CoachLayout';
import { TodayTab } from '@/components/tabs/TodayTab';
import { DiaryTab } from '@/components/tabs/DiaryTab';
import { MemoryTab } from '@/components/tabs/MemoryTab';
import { ActionPlansTab } from '@/components/tabs/ActionPlansTab';
import { ScriptureTab } from '@/components/tabs/ScriptureTab';
import { InsightsTab } from '@/components/tabs/InsightsTab';
import { SettingsTab } from '@/components/tabs/SettingsTab';
import type { CoachTab } from '@/types/coach';
import { Skeleton } from '@/components/ui/skeleton';

function CoachContent() {
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') as CoachTab) || 'today';

  return (
    <>
      {tab === 'today' && <TodayTab />}
      {tab === 'diary' && <DiaryTab />}
      {tab === 'memory' && <MemoryTab />}
      {tab === 'action-plans' && <ActionPlansTab />}
      {tab === 'scripture' && <ScriptureTab />}
      {tab === 'insights' && <InsightsTab />}
      {tab === 'settings' && <SettingsTab />}
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export default function CoachPage() {
  return (
    <CoachLayout>
      <Suspense fallback={<LoadingFallback />}>
        <CoachContent />
      </Suspense>
    </CoachLayout>
  );
}
