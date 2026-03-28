import { redirect } from 'next/navigation';
import {
  Activity,
  ArrowUpRight,
  Clock3,
  KeyRound,
  Layers3,
  Route,
  ShieldCheck,
  Sparkles,
  Users,
  WandSparkles,
} from 'lucide-react';
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

function getInviteStatus(row: InviteCodeRow) {
  if (!row.is_active) return { label: 'Inactive', className: 'bg-slate-700/70 text-slate-200 ring-1 ring-slate-500/40' };
  if (row.expires_at && new Date(row.expires_at) < new Date()) return { label: 'Expired', className: 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30' };
  if (row.max_uses && row.used_count >= row.max_uses) return { label: 'Used', className: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30' };
  return { label: 'Active', className: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30' };
}

function routeChips(route: string | null) {
  if (!route) return ['No route tracked'];
  return route
    .split(/[/?=&]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4);
}

async function createInviteCodeAction() {
  'use server';
  const { authorized, supabase } = await requireAdminAccess();
  if (!authorized) redirect('/coach');
  await supabase.rpc('create_beta_invite_code', { expires_in_days: 14, max_uses: 1 });
  redirect('/admin/beta-testers');
}

function SectionFrame({ title, subtitle, children, eyebrow }: { title: string; subtitle?: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <div className="border-b border-white/8 px-5 py-4 sm:px-6">
        {eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-500">{eyebrow}</p>}
        <h2 className="mt-1 text-base font-semibold text-white sm:text-lg">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      <div>{children}</div>
    </section>
  );
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

  const topRoutes = tops.filter((item) => item.kind === 'route').slice(0, 5);
  const topActions = tops.filter((item) => item.kind === 'action').slice(0, 5);

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.10),transparent_24%),linear-gradient(180deg,#07111f_0%,#0b1324_45%,#08101d_100%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="space-y-8">
          <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-950/90 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
            <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-10">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-cyan-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin-only Beta Console
                </div>
                <div className="space-y-3">
                  <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Vanto Coach Beta Management Console</h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                    Operator-grade reporting for tester growth, invite supply, activity signals, and recent product movement using only real tracked beta data.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Top page</div>
                    <div className="mt-1 font-medium text-white">{overview?.top_page ?? 'Not yet instrumented'}</div>
                    <div className="mt-1 text-xs text-slate-500">{overview?.top_page_views ?? 0} tracked views</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Top action</div>
                    <div className="mt-1 font-medium text-white">{overview?.top_action ?? 'Not yet instrumented'}</div>
                    <div className="mt-1 text-xs text-slate-500">{overview?.top_action_count ?? 0} action hits</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Reporting focus</div>
                    <div className="mt-1 font-medium text-white">Tester activity first</div>
                    <div className="mt-1 text-xs text-slate-500">Invites + telemetry aligned</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-inner shadow-black/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Invite management</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Operational invite control</h2>
                    <p className="mt-1 text-sm text-slate-400">Create one-click beta access codes and keep active inventory visible from the top of the dashboard.</p>
                  </div>
                  <Sparkles className="h-5 w-5 text-cyan-300" />
                </div>
                <form action={createInviteCodeAction} className="mt-6">
                  <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                    <KeyRound className="h-4 w-4" />
                    Generate invite code
                  </button>
                </form>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Active codes</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{overview?.active_invite_codes ?? 0}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Tester base</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{overview?.total_testers ?? testers.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total beta testers', value: overview?.total_testers ?? testers.length, meta: 'Real authenticated users', icon: <Users className="h-5 w-5" />, accent: 'from-cyan-400/30 to-cyan-500/5' },
              { label: 'Active invite codes', value: overview?.active_invite_codes ?? 0, meta: 'Immediately available invites', icon: <KeyRound className="h-5 w-5" />, accent: 'from-emerald-400/30 to-emerald-500/5' },
              { label: 'Top page views', value: overview?.top_page_views ?? 0, meta: overview?.top_page ?? 'Not yet instrumented', icon: <Layers3 className="h-5 w-5" />, accent: 'from-fuchsia-400/30 to-fuchsia-500/5' },
              { label: 'Top action count', value: overview?.top_action_count ?? 0, meta: overview?.top_action ?? 'Not yet instrumented', icon: <WandSparkles className="h-5 w-5" />, accent: 'from-amber-400/30 to-amber-500/5' },
            ].map((card) => (
              <div key={card.label} className={`rounded-[28px] border border-white/10 bg-gradient-to-br ${card.accent} bg-slate-900/85 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">{card.label}</span>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-200">{card.icon}</div>
                </div>
                <div className="mt-6 text-4xl font-semibold tracking-tight text-white">{card.value}</div>
                <div className="mt-2 text-sm text-slate-400">{card.meta}</div>
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <SectionFrame
              eyebrow="High-priority operations"
              title="Invite codes"
              subtitle="Invite inventory stays high on the page so the admin can create, inspect, and understand code readiness without leaving the dashboard."
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">Code</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4 font-medium">Usage</th>
                      <th className="px-5 py-4 font-medium">Used by</th>
                      <th className="px-5 py-4 font-medium">Expires</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invites.map((row) => {
                      const status = getInviteStatus(row);
                      return (
                        <tr key={row.id} className="transition hover:bg-white/[0.03]">
                          <td className="px-5 py-4">
                            <div className="inline-flex items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 font-mono text-cyan-100">
                              {row.code}
                            </div>
                            <div className="mt-2 text-xs text-slate-500">Created {formatDate(row.created_at)}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${status.className}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {row.used_count}{row.max_uses ? ` / ${row.max_uses}` : ''}
                          </td>
                          <td className="px-5 py-4 text-slate-300">{row.used_by_email ?? '—'}</td>
                          <td className="px-5 py-4 text-slate-400">{formatDate(row.expires_at)}</td>
                        </tr>
                      );
                    })}
                    {invites.length === 0 && (
                      <tr>
                        <td className="px-5 py-10 text-center text-sm text-slate-500" colSpan={5}>No invite codes yet. Generate one to onboard the next tester.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionFrame>

            <SectionFrame
              eyebrow="Usage ranking"
              title="Top pages and top actions"
              subtitle="A quick operator view of where testers spend time and which product actions they hit the most."
            >
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <div className="rounded-[24px] border border-white/8 bg-slate-950/40 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Pages visited</h3>
                    <Route className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {topRoutes.length === 0 ? <p className="text-sm text-slate-500">Not yet instrumented.</p> : topRoutes.map((item, index) => (
                      <div key={`${item.kind}-${item.label}`} className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{item.label}</p>
                          <p className="mt-1 text-xs text-slate-500">Page rank #{index + 1}</p>
                        </div>
                        <span className="text-sm font-semibold text-cyan-200">{item.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-slate-950/40 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Most-used actions</h3>
                    <Activity className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {topActions.length === 0 ? <p className="text-sm text-slate-500">Not yet instrumented.</p> : topActions.map((item, index) => (
                      <div key={`${item.kind}-${item.label}`} className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{item.label}</p>
                          <p className="mt-1 text-xs text-slate-500">Action rank #{index + 1}</p>
                        </div>
                        <span className="text-sm font-semibold text-emerald-200">{item.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionFrame>
          </section>

          <SectionFrame
            eyebrow="Primary reporting surface"
            title="Tester activity roster"
            subtitle="The dominant reporting section prioritizes joined date, last active time, action volume, sessions, and last route for fast operator scanning."
          >
            <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-2 xl:grid-cols-1">
              {activity.length === 0 ? (
                <div className="rounded-[24px] border border-white/6 bg-white/[0.03] px-5 py-10 text-center text-sm text-slate-500">Not yet instrumented.</div>
              ) : activity.map((row) => {
                const testerSummary = testers.find((tester) => tester.id === row.user_id);
                return (
                  <div key={row.user_id} className="rounded-[28px] border border-white/8 bg-slate-950/45 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div>
                          <p className="text-lg font-semibold text-white">{row.email}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Tester ID · {row.user_id.slice(0, 8)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {routeChips(row.last_route).map((chip) => (
                            <span key={chip} className="rounded-full border border-cyan-400/15 bg-cyan-400/8 px-3 py-1 text-xs font-medium text-cyan-100">
                              {chip}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[540px] xl:grid-cols-5">
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Joined</div>
                          <div className="mt-2 text-sm font-medium text-white">{formatDate(testerSummary?.created_at ?? row.first_seen)}</div>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Last active</div>
                          <div className="mt-2 text-sm font-medium text-white">{formatDate(row.last_seen)}</div>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Actions</div>
                          <div className="mt-2 text-sm font-semibold text-cyan-200">{row.total_events}</div>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Sessions</div>
                          <div className="mt-2 text-sm font-semibold text-emerald-200">{row.total_sessions}</div>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Last route</div>
                          <div className="mt-2 text-sm font-medium text-white">{row.last_route ?? '—'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionFrame>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <SectionFrame
              eyebrow="Live telemetry"
              title="Recent activity feed"
              subtitle="A rolling event stream that tells the operator what is happening right now across the beta experience."
            >
              <div className="p-4 sm:p-6">
                <div className="space-y-3">
                  {recent.length === 0 ? <p className="text-sm text-slate-500">Not yet instrumented.</p> : recent.slice(0, 20).map((row) => (
                    <div key={row.id} className="rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{row.email ?? 'Unknown user'} · {row.event_name}</p>
                          <p className="mt-1 text-xs text-slate-400">{row.route ?? '—'} · {row.tab_name ?? row.action_name ?? '—'}</p>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-slate-950/50 px-3 py-1 text-xs text-slate-400">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatDate(row.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionFrame>

            <SectionFrame
              eyebrow="Reference roster"
              title="Tester summary"
              subtitle="High-level identity and activation context remains available beside the live telemetry feed."
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">Email</th>
                      <th className="px-5 py-4 font-medium">Signed up</th>
                      <th className="px-5 py-4 font-medium">Last active</th>
                      <th className="px-5 py-4 font-medium">Sessions</th>
                      <th className="px-5 py-4 font-medium">Activated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {testers.map((row) => (
                      <tr key={row.id} className="transition hover:bg-white/[0.03]">
                        <td className="px-5 py-4 font-medium text-white">{row.email}</td>
                        <td className="px-5 py-4 text-slate-300">{formatDate(row.created_at)}</td>
                        <td className="px-5 py-4 text-slate-300">{formatDate(row.last_sign_in_at ?? row.first_session_at)}</td>
                        <td className="px-5 py-4 text-slate-300">{row.total_sessions}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${row.total_sessions > 0 ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30' : 'bg-slate-700/70 text-slate-200 ring-1 ring-slate-500/40'}`}>
                            {row.total_sessions > 0 ? 'Active' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionFrame>
          </section>
        </div>
      </div>
    </main>
  );
}
