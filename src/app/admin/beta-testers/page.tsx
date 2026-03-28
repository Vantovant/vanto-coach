import { redirect } from 'next/navigation';
import { requireAdminAccess } from '@/lib/supabase/server';

interface BetaTesterRow {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  total_sessions: number;
  first_session_at: string | null;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default async function BetaTestersPage() {
  const { authorized, supabase } = await requireAdminAccess();

  if (!authorized) {
    redirect('/coach');
  }

  const { data: testers, error } = await supabase.rpc('get_beta_testers_overview');

  if (error) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="mx-auto max-w-5xl space-y-4">
          <h1 className="text-3xl font-serif font-semibold tracking-tight">Beta Testers</h1>
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Could not load beta tester metrics.
          </p>
        </div>
      </main>
    );
  }

  const rows = (testers ?? []) as BetaTesterRow[];
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDayKey = sevenDaysAgo.toISOString().slice(0, 10);

  const totalBetaTesters = rows.length;
  const newToday = rows.filter((row) => row.created_at.slice(0, 10) === todayKey).length;
  const newLast7Days = rows.filter((row) => row.created_at.slice(0, 10) >= sevenDayKey).length;
  const activatedCount = rows.filter((row) => row.total_sessions > 0).length;
  const activationRate = totalBetaTesters > 0 ? Math.round((activatedCount / totalBetaTesters) * 100) : 0;

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-serif font-semibold tracking-tight">Beta Testers</h1>
          <p className="text-sm text-muted-foreground">Real signup and session activity for approved testers.</p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total beta testers</p>
            <p className="mt-2 text-3xl font-semibold">{totalBetaTesters}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">New signups today</p>
            <p className="mt-2 text-3xl font-semibold">{newToday}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">New signups last 7 days</p>
            <p className="mt-2 text-3xl font-semibold">{newLast7Days}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Activation rate</p>
            <p className="mt-2 text-3xl font-semibold">{activationRate}%</p>
          </div>
        </section>

        <section className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="font-medium">Tester details</h2>
            <p className="text-sm text-muted-foreground">Signup failures by error reason and Today/Insights usage are not yet instrumented.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Signed up</th>
                  <th className="px-4 py-3 font-medium">Last active</th>
                  <th className="px-4 py-3 font-medium">Total sessions</th>
                  <th className="px-4 py-3 font-medium">Activated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3">{formatDate(row.last_sign_in_at ?? row.first_session_at)}</td>
                    <td className="px-4 py-3">{row.total_sessions}</td>
                    <td className="px-4 py-3">{row.total_sessions > 0 ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={5}>No beta testers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
