import { redirect } from 'next/navigation';
import { requireAdminAccess } from '@/lib/supabase/server';

interface OverviewRow {
  total_testers: number;
  active_invite_codes: number;
  top_page: string | null;
  top_page_views: number | null;
  top_action: string | null;
  top_action_count: number | null;
}

interface SummaryRow {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  total_sessions: number;
  first_session_at: string | null;
}

interface TopRow {
  kind: 'route' | 'action';
  label: string;
  total: number;
}

interface ActivityRow {
  user_id: string;
  email: string;
  first_seen: string | null;
  last_seen: string | null;
  total_events: number;
  total_sessions: number;
  last_route: string | null;
}

interface RecentRow {
  id: string;
  user_id: string | null;
  email: string | null;
  event_name: string;
  route: string | null;
  tab_name: string | null;
  action_name: string | null;
  created_at: string;
}

interface InviteCodeRow {
  id: string;
  code: string;
  is_active: boolean;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  used_by_email: string | null;
  used_at: string | null;
  created_at: string;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

async function createInviteCodeAction() {
  'use server';
  const { authorized, supabase } = await requireAdminAccess();
  if (!authorized) redirect('/coach');
  await supabase.rpc('create_beta_invite_code', { expires_in_days: 14, max_uses: 1 });
  redirect('/admin/beta-testers');
}

export default async function BetaTestersPage() {
  const { authorized, supabase } = await requireAdminAccess();
  if (!authorized) redirect('/coach');

  const [overviewRes, summaryRes, topRes, activityRes, recentRes, inviteRes] = await Promise.all([
    supabase.rpc('get_beta_console_overview'),
    supabase.rpc('get_beta_testers_overview'),
    supabase.rpc('get_beta_top_routes_and_actions'),
    supabase.rpc('get_beta_user_activity'),
    supabase.rpc('get_beta_recent_activity'),
    supabase.rpc('get_beta_invite_codes'),
  ]);

  const overview = ((overviewRes.data ?? [])[0] ?? null) as OverviewRow | null;
  const testers = (summaryRes.data ?? []) as SummaryRow[];
  const tops = (topRes.data ?? []) as TopRow[];
  const activity = (activityRes.data ?? []) as ActivityRow[];
  const recent = (recentRes.data ?? []) as RecentRow[];
  const invites = (inviteRes.data ?? []) as InviteCodeRow[];

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-semibold tracking-tight">Beta Testers</h1>
            <p className="text-sm text-muted-foreground">Admin-only analytics, tester activity, and invite-code management.</p>
          </div>
          <form action={createInviteCodeAction}>
            <button type="submit" className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">
              Generate invite code
            </button>
          </form>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Total beta testers</p><p className="mt-2 text-3xl font-semibold">{overview?.total_testers ?? testers.length}</p></div>
          <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Active invite codes</p><p className="mt-2 text-3xl font-semibold">{overview?.active_invite_codes ?? 0}</p></div>
          <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Top page</p><p className="mt-2 text-lg font-semibold">{overview?.top_page ?? 'Not yet instrumented'}</p><p className="text-xs text-muted-foreground">{overview?.top_page_views ?? 0} views</p></div>
          <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Top action</p><p className="mt-2 text-lg font-semibold">{overview?.top_action ?? 'Not yet instrumented'}</p><p className="text-xs text-muted-foreground">{overview?.top_action_count ?? 0} events</p></div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card">
            <div className="border-b px-4 py-3"><h2 className="font-medium">Top pages and actions</h2></div>
            <div className="divide-y">
              {tops.length === 0 ? <p className="px-4 py-4 text-sm text-muted-foreground">Not yet instrumented.</p> : tops.slice(0, 12).map((item) => (
                <div key={`${item.kind}-${item.label}`} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div><p className="font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.kind}</p></div>
                  <span>{item.total}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card">
            <div className="border-b px-4 py-3"><h2 className="font-medium">Invite codes</h2></div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead><tr className="text-left text-muted-foreground"><th className="px-4 py-3 font-medium">Code</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Used by</th><th className="px-4 py-3 font-medium">Expires</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {invites.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-mono">{row.code}</td>
                      <td className="px-4 py-3">{!row.is_active ? 'inactive' : row.expires_at && new Date(row.expires_at) < new Date() ? 'expired' : row.max_uses && row.used_count >= row.max_uses ? 'used' : 'active'}</td>
                      <td className="px-4 py-3">{row.used_by_email ?? '—'}</td>
                      <td className="px-4 py-3">{formatDate(row.expires_at)}</td>
                    </tr>
                  ))}
                  {invites.length === 0 && <tr><td className="px-4 py-6 text-muted-foreground" colSpan={4}>No invite codes yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3"><h2 className="font-medium">Per-user activity</h2></div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead><tr className="text-left text-muted-foreground"><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">First seen</th><th className="px-4 py-3 font-medium">Last seen</th><th className="px-4 py-3 font-medium">Events</th><th className="px-4 py-3 font-medium">Sessions</th><th className="px-4 py-3 font-medium">Last route</th></tr></thead>
              <tbody className="divide-y divide-border">
                {activity.map((row) => (
                  <tr key={row.user_id}>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3">{formatDate(row.first_seen)}</td>
                    <td className="px-4 py-3">{formatDate(row.last_seen)}</td>
                    <td className="px-4 py-3">{row.total_events}</td>
                    <td className="px-4 py-3">{row.total_sessions}</td>
                    <td className="px-4 py-3">{row.last_route ?? '—'}</td>
                  </tr>
                ))}
                {activity.length === 0 && <tr><td className="px-4 py-6 text-muted-foreground" colSpan={6}>Not yet instrumented.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3"><h2 className="font-medium">Recent activity feed</h2></div>
          <div className="divide-y">
            {recent.length === 0 ? <p className="px-4 py-4 text-sm text-muted-foreground">Not yet instrumented.</p> : recent.slice(0, 25).map((row) => (
              <div key={row.id} className="px-4 py-3 text-sm">
                <p className="font-medium">{row.email ?? 'Unknown user'} — {row.event_name}</p>
                <p className="text-xs text-muted-foreground">{row.route ?? '—'} · {row.tab_name ?? row.action_name ?? '—'} · {formatDate(row.created_at)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3"><h2 className="font-medium">Tester summary</h2></div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead><tr className="text-left text-muted-foreground"><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Signed up</th><th className="px-4 py-3 font-medium">Last active</th><th className="px-4 py-3 font-medium">Total sessions</th><th className="px-4 py-3 font-medium">Activated</th></tr></thead>
              <tbody className="divide-y divide-border">
                {testers.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3">{formatDate(row.last_sign_in_at ?? row.first_session_at)}</td>
                    <td className="px-4 py-3">{row.total_sessions}</td>
                    <td className="px-4 py-3">{row.total_sessions > 0 ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
