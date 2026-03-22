'use client';

import * as React from 'react';
import { format, parseISO, subDays, startOfWeek, endOfWeek } from 'date-fns';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Brain,
  Calendar,
  ChevronRight,
  BarChart3,
  RefreshCw,
  Download,
  Share2,
  Sparkles,
  Heart,
  Activity,
  Wallet,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  BookMarked,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CoachInsight, GrowthArea, LifeBalanceScore } from '@/types/coach';
import { cn } from '@/lib/utils';
import { getRecentSessions } from '@/lib/supabase/db';
import { useAuth } from '@/context/AuthContext';

export function InsightsTab() {
  const { user } = useAuth();
  const [period, setPeriod] = React.useState<'week' | 'month' | 'quarter'>('week');
  const [activeTab, setActiveTab] = React.useState<'overview' | 'growth' | 'recommendations'>('overview');
  const [insight, setInsight] = React.useState<CoachInsight | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    setLoading(true);
    // 90 days max covers the longest insight period (quarter) without full history load
    getRecentSessions(90).then(sessions => {
      if (!sessions.length) { setLoading(false); return; }

      const today = new Date();
      const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 90;
      const cutoff = new Date(today.getTime() - periodDays * 86400000);
      const periodSessions = sessions.filter(s => new Date(s.session_date) >= cutoff);

      // Derive mood trend
      const moodCounts: Record<string, number> = {};
      let positiveDays = 0;
      for (const s of periodSessions) {
        if (s.mood) moodCounts[s.mood] = (moodCounts[s.mood] ?? 0) + 1;
        if (['grateful', 'hopeful', 'peaceful', 'joyful'].includes(s.mood ?? '')) positiveDays++;
      }
      const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'reflective';

      // Derive life area frequency
      const areaCounts: Record<string, number> = {};
      for (const s of periodSessions) {
        for (const a of (s.life_areas ?? [])) areaCounts[a] = (areaCounts[a] ?? 0) + 1;
      }

      const derived: CoachInsight = {
        id: `derived-${period}`,
        user_id: user.id,
        insight_type: (period === 'week' ? 'weekly_review' : 'monthly_review') as CoachInsight['insight_type'],
        period_start: cutoff.toISOString().slice(0, 10),
        period_end: today.toISOString().slice(0, 10),
        title: `${period === 'week' ? 'Weekly' : period === 'month' ? 'Monthly' : 'Quarterly'} Review`,
        summary: periodSessions.length
          ? `${periodSessions.length} session${periodSessions.length > 1 ? 's' : ''} recorded this ${period}. Dominant mood: ${dominantMood}.`
          : `No sessions recorded this ${period} yet.`,
        key_observations: periodSessions.slice(0, 4).map(s => s.summary ?? s.title).filter(Boolean),
        growth_areas: Object.entries(areaCounts).slice(0, 4).map(([area, count]) => ({
          area: area as GrowthArea['area'],
          score: Math.min(100, count * 20),
          trend: 'stable' as const,
          insight: `Mentioned in ${count} session${count > 1 ? 's' : ''}`,
        })),
        challenges: periodSessions.flatMap(s => s.structured_entry?.struggles ?? []).slice(0, 3),
        recommendations: ['Keep journaling consistently', 'Review and act on extracted action items', 'Pray over recurring struggles'],
        scripture_focus: [],
        next_steps: periodSessions.flatMap(s => s.structured_entry?.followups ?? []).slice(0, 3),
        mood_trend: {
          dominant_mood: dominantMood as CoachInsight['mood_trend']['dominant_mood'],
          variance: 0.5,
          positive_days: positiveDays,
          challenging_days: periodSessions.length - positiveDays,
        },
        life_balance: {
          faith: (areaCounts['faith'] ?? 0) * 15 || 50,
          family: (areaCounts['family'] ?? 0) * 15 || 50,
          health: (areaCounts['health'] ?? 0) * 15 || 50,
          finances: (areaCounts['finances'] ?? 0) * 15 || 50,
          business: (areaCounts['business'] ?? 0) * 15 || 50,
          relationships: (areaCounts['relationships'] ?? 0) * 15 || 50,
          rest: (areaCounts['rest'] ?? 0) * 15 || 50,
          growth: (areaCounts['personal_growth'] ?? 0) * 15 || 50,
        },
        created_at: new Date().toISOString(),
      };
      setInsight(derived);
      setLoading(false);
    });
  }, [user, period]);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  return (
    <div className="pb-24 md:pb-8">
      {/* Header */}
      <div className="relative border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/[0.03] via-transparent to-primary/[0.02]" />
        <div className="container max-w-6xl mx-auto px-4 py-8 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-accent" />
                </div>
                Life Insights
              </h1>
              <p className="text-muted-foreground mt-1.5">
                Executive coaching reports and growth analysis.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Period Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </span>
        </div>

        {/* Weekly Summary Card */}
        {loading && (
          <Card className="card-elevated">
            <CardContent className="py-10 text-center">
              <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3 animate-pulse" />
              <p className="text-sm text-muted-foreground">Building insights from your sessions…</p>
            </CardContent>
          </Card>
        )}
        {!loading && insight && (
        <Card className="card-elevated bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{insight.title}</CardTitle>
              </div>
              <Badge variant="secondary">
                {format(parseISO(insight.period_end), 'MMM d')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {insight.summary}
            </p>
          </CardContent>
        </Card>
        )}
        {!loading && !insight && (
          <Card className="card-elevated">
            <CardContent className="py-10 text-center">
              <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No sessions yet. Start recording to build insights.</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs — only shown when insight data exists */}
        {!loading && insight && <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="growth">Growth Areas</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Life Balance Radar */}
            <Card className="card-premium">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Life Balance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Object.entries(insight.life_balance).map(([area, score]) => (
                    <BalanceItem key={area} area={area} score={score} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mood Trend */}
            <Card className="card-premium">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-[hsl(var(--spiritual))]" />
                  <CardTitle className="text-base">Emotional Trend</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Dominant Mood</p>
                    <p className="text-lg font-medium capitalize">
                      {getMoodEmoji(insight.mood_trend.dominant_mood)} {insight.mood_trend.dominant_mood}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-success/10 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Positive Days</p>
                    <p className="text-2xl font-semibold text-success">
                      {insight.mood_trend.positive_days}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-warning/10 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Challenging Days</p>
                    <p className="text-2xl font-semibold text-warning">
                      {insight.mood_trend.challenging_days}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Stability</p>
                    <Progress
                      value={(1 - insight.mood_trend.variance) * 100}
                      className="h-2 mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((1 - insight.mood_trend.variance) * 100)}% stable
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Observations */}
            <Card className="card-premium">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Key Observations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {insight.key_observations.map((observation, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-primary">{idx + 1}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{observation}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Challenges */}
            <Card className="card-premium border-l-4 border-l-warning">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  <CardTitle className="text-base">Current Challenges</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insight.challenges.map((challenge, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-warning" />
                      {challenge}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="growth" className="space-y-6 mt-6">
            {/* Growth Areas Detail */}
            <div className="grid gap-4 md:grid-cols-2">
              {insight.growth_areas.map((area) => (
                <GrowthAreaCard key={area.area} area={area} />
              ))}
            </div>

            {/* Scripture Focus */}
            {insight.scripture_focus.length > 0 && (
              <Card className="card-premium bg-gradient-to-r from-[hsl(var(--scripture))]/30 to-transparent">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <BookMarked className="h-5 w-5 text-accent" />
                    <CardTitle className="text-base">Scripture Focus</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {insight.scripture_focus.map((scripture, idx) => (
                    <div key={idx} className="border-l-2 border-accent pl-4">
                      <p className="text-sm font-medium mb-1">
                        {scripture.book} {scripture.chapter}:{scripture.verse_start}
                        {scripture.verse_end && `-${scripture.verse_end}`}
                      </p>
                      <p className="text-sm text-muted-foreground italic">
                        "{scripture.text}"
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6 mt-6">
            {/* Recommendations */}
            <Card className="card-premium">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Coaching Recommendations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {insight.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{rec}</p>
                        <Button variant="link" size="sm" className="px-0 mt-1 h-auto">
                          Create Action
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="card-premium border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Next Steps</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {insight.next_steps.map((step, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-primary">{idx + 1}</span>
                      </div>
                      <span className="text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Generate Report */}
            <Card className="card-premium bg-muted/30">
              <CardContent className="p-6 text-center">
                <Sparkles className="h-10 w-10 mx-auto text-[hsl(var(--spiritual))] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Generate Detailed Report</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a comprehensive executive life coaching report with AI-powered analysis.
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    7-Day Analysis
                  </Button>
                  <Button className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Full Coaching Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>}
      </div>
    </div>
  );
}

function BalanceItem({ area, score }: { area: string; score: number }) {
  const icon = getAreaIcon(area);
  const color = score >= 70 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-destructive';
  const bgColor = score >= 70 ? 'bg-success/20' : score >= 50 ? 'bg-warning/20' : 'bg-destructive/20';

  return (
    <div className="text-center">
      <div className={cn('h-12 w-12 rounded-full mx-auto flex items-center justify-center mb-2', bgColor)}>
        {icon}
      </div>
      <p className="text-sm font-medium capitalize mb-1">{area}</p>
      <div className="flex items-center justify-center gap-2">
        <Progress
          value={score}
          className={cn(
            'h-1.5 w-16',
            score >= 70 && '[&>div]:bg-success',
            score >= 50 && score < 70 && '[&>div]:bg-warning',
            score < 50 && '[&>div]:bg-destructive'
          )}
        />
        <span className={cn('text-sm font-semibold', color)}>{score}%</span>
      </div>
    </div>
  );
}

function GrowthAreaCard({ area }: { area: GrowthArea }) {
  return (
    <Card className="card-premium">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getAreaIcon(area.area)}
            <span className="font-medium capitalize">{area.area}</span>
          </div>
          <div className={cn(
            'flex items-center gap-1 text-sm font-semibold',
            area.trend === 'up' && 'text-success',
            area.trend === 'down' && 'text-destructive',
            area.trend === 'stable' && 'text-muted-foreground'
          )}>
            {area.trend === 'up' && <TrendingUp className="h-4 w-4" />}
            {area.trend === 'down' && <TrendingDown className="h-4 w-4" />}
            {area.trend === 'stable' && <Minus className="h-4 w-4" />}
            {area.score}%
          </div>
        </div>
        <Progress
          value={area.score}
          className={cn(
            'h-2 mb-3',
            area.score >= 70 && '[&>div]:bg-success',
            area.score >= 50 && area.score < 70 && '[&>div]:bg-warning',
            area.score < 50 && '[&>div]:bg-destructive'
          )}
        />
        <p className="text-sm text-muted-foreground">{area.insight}</p>
      </CardContent>
    </Card>
  );
}

function getAreaIcon(area: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    faith: <Sparkles className="h-5 w-5 text-[hsl(var(--spiritual))]" />,
    family: <Users className="h-5 w-5 text-primary" />,
    health: <Activity className="h-5 w-5 text-success" />,
    finances: <Wallet className="h-5 w-5 text-warning" />,
    business: <Target className="h-5 w-5 text-primary" />,
    relationships: <Heart className="h-5 w-5 text-[hsl(var(--spiritual))]" />,
    rest: <Clock className="h-5 w-5 text-muted-foreground" />,
    growth: <TrendingUp className="h-5 w-5 text-success" />,
    leadership: <Target className="h-5 w-5 text-primary" />,
  };
  return icons[area] || <Brain className="h-5 w-5" />;
}

function getMoodEmoji(mood: string): string {
  const emojis: Record<string, string> = {
    grateful: '🙏',
    hopeful: '🌟',
    peaceful: '☮️',
    joyful: '😊',
    reflective: '🤔',
    anxious: '😰',
    stressed: '😓',
    overwhelmed: '😵',
    neutral: '😐',
  };
  return emojis[mood] || '📝';
}
