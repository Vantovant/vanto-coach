'use client';

import * as React from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Filter,
  Search,
  Calendar,
  Repeat,
  Sparkles,
  Check,
  X,
  MoreVertical,
  Play,
  Pause,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CoachActionItem, ActionType } from '@/types/coach';
import { cn } from '@/lib/utils';
import { getActionItems, updateActionItemStatus, bulkUpdateActionItemStatus } from '@/lib/supabase/db';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { captureError, captureMessage } from '@/lib/monitoring';

export function ActionPlansTab() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState<'pending' | 'approved' | 'all'>('pending');
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState('');
  const [actionItems, setActionItems] = React.useState<CoachActionItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    setLoading(true);
    getActionItems().then(data => { setActionItems(data); setLoading(false); });
  }, [user]);

  const filteredItems = React.useMemo(() => {
    return actionItems.filter(item => {
      const matchesSearch = searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'all' || item.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab, actionItems]);

  const groupedBySession = React.useMemo(() => {
    const groups: { [key: string]: { sessionId: string; items: CoachActionItem[] } } = {};
    filteredItems.forEach(item => {
      const key = item.session_id ?? 'no-session';
      if (!groups[key]) groups[key] = { sessionId: key, items: [] };
      groups[key].items.push(item);
    });
    return groups;
  }, [filteredItems]);

  const pendingCount = actionItems.filter(i => i.status === 'pending').length;
  const approvedCount = actionItems.filter(i => i.status === 'approved').length;

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    const pendingIds = filteredItems.filter(i => i.status === 'pending').map(i => i.id);
    setSelectedItems(new Set(pendingIds));
  };

  // ── Per-item handlers ────────────────────────────────────────────────────

  const handleApproveItem = React.useCallback(async (id: string) => {
    // Optimistic
    setActionItems(prev => prev.map(i => i.id === id ? { ...i, status: 'approved' as const } : i));
    const ok = await updateActionItemStatus(id, 'approved');
    if (!ok) {
      setActionItems(prev => prev.map(i => i.id === id ? { ...i, status: 'pending' as const } : i));
      captureMessage('approveItem failed', 'error', { context: 'actions:approve', actionItemId: id });
      toast.error('Failed to approve action', { description: 'Please try again.' });
    } else {
      toast.success('Action approved');
    }
  }, []);

  const handleRejectItem = React.useCallback(async (id: string) => {
    // Optimistic
    setActionItems(prev => prev.map(i => i.id === id ? { ...i, status: 'rejected' as const } : i));
    const ok = await updateActionItemStatus(id, 'rejected');
    if (!ok) {
      setActionItems(prev => prev.map(i => i.id === id ? { ...i, status: 'pending' as const } : i));
      captureMessage('rejectItem failed', 'error', { context: 'actions:reject', actionItemId: id });
      toast.error('Failed to reject action', { description: 'Please try again.' });
    } else {
      toast.success('Action rejected');
    }
  }, []);

  const handleMoveToPending = React.useCallback(async (id: string, prevStatus: CoachActionItem['status']) => {
    setActionItems(prev => prev.map(i => i.id === id ? { ...i, status: 'pending' as const } : i));
    const ok = await updateActionItemStatus(id, 'pending');
    if (!ok) {
      setActionItems(prev => prev.map(i => i.id === id ? { ...i, status: prevStatus } : i));
      captureMessage('moveToPending failed', 'error', { context: 'actions:pending', actionItemId: id });
      toast.error('Failed to update action', { description: 'Please try again.' });
    } else {
      toast.success('Moved back to pending');
    }
  }, []);

  // ── Bulk handlers ────────────────────────────────────────────────────────

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedItems);
    if (!ids.length) return;
    // Optimistic
    setActionItems(prev => prev.map(i =>
      ids.includes(i.id) ? { ...i, status: 'approved' as const } : i
    ));
    setSelectedItems(new Set());

    const { succeeded, failed } = await bulkUpdateActionItemStatus(ids, 'approved');
    if (failed > 0) {
      captureMessage(`bulk approve: ${failed}/${ids.length} failed`, 'warning', { context: 'actions:bulkApprove' });
      toast.error(`${failed} action${failed > 1 ? 's' : ''} failed to approve`, {
        description: 'The rest were approved successfully.',
      });
    } else {
      toast.success(`${succeeded} action${succeeded > 1 ? 's' : ''} approved`);
    }
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedItems);
    if (!ids.length) return;
    // Optimistic
    setActionItems(prev => prev.map(i =>
      ids.includes(i.id) ? { ...i, status: 'rejected' as const } : i
    ));
    setSelectedItems(new Set());

    const { succeeded, failed } = await bulkUpdateActionItemStatus(ids, 'rejected');
    if (failed > 0) {
      captureMessage(`bulk reject: ${failed}/${ids.length} failed`, 'warning', { context: 'actions:bulkReject' });
      toast.error(`${failed} action${failed > 1 ? 's' : ''} failed to reject`, {
        description: 'The rest were rejected successfully.',
      });
    } else {
      toast.success(`${succeeded} action${succeeded > 1 ? 's' : ''} rejected`);
    }
  };

  return (
    <div className="pb-24 md:pb-8">
      {/* Header */}
      <div className="relative border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-success/[0.02]" />
        <div className="container max-w-6xl mx-auto px-4 py-8 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                Action Plans
              </h1>
              <p className="text-muted-foreground mt-1.5">
                Tasks, goals, and habits extracted from your journal entries.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedItems.size > 0 && (
                <>
                  <Badge variant="secondary">{selectedItems.size} selected</Badge>
                  <Button variant="outline" size="sm" onClick={() => setSelectedItems(new Set())}>Clear</Button>
                  <Button variant="outline" size="sm" onClick={handleBulkReject} className="gap-2">
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button size="sm" onClick={handleBulkApprove} className="gap-2">
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-premium">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-semibold">{pendingCount}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-premium">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-semibold">{approvedCount}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-premium">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Extracted</p>
                  <p className="text-2xl font-semibold">{actionItems.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[hsl(var(--spiritual))]/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-[hsl(var(--spiritual))]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                Pending
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{pendingCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Bulk Actions Bar */}
        {activeTab === 'pending' && pendingCount > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedItems.size === pendingCount && pendingCount > 0}
                onCheckedChange={(checked) => checked ? selectAll() : setSelectedItems(new Set())}
              />
              <span className="text-sm text-muted-foreground">Select all pending items</span>
            </div>
            {selectedItems.size > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={handleBulkReject}>
                  <X className="h-4 w-4" />
                  Reject
                </Button>
                <Button size="sm" onClick={handleBulkApprove} className="gap-2">
                  <Check className="h-4 w-4" />
                  Approve Selected
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Action Items by Session */}
        <div className="space-y-6">
          {Object.entries(groupedBySession).map(([sessionId, { items }]) => (
            <Card key={sessionId} className="card-premium">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Session</CardTitle>
                      <CardDescription className="text-xs">
                        {items[0]?.created_at ? format(parseISO(items[0].created_at), 'MMMM d, yyyy') : 'Unknown date'}
                        {' • '}{items.length} actions extracted
                      </CardDescription>
                    </div>
                  </div>
                  <Link href={`/coach?tab=diary&session=${sessionId}`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      View Entry
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map(item => (
                    <ActionItemRow
                      key={item.id}
                      item={item}
                      isSelected={selectedItems.has(item.id)}
                      onToggleSelect={() => toggleSelect(item.id)}
                      onApprove={handleApproveItem}
                      onReject={handleRejectItem}
                      onMoveToPending={handleMoveToPending}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredItems.length === 0 && (
            <Card className="card-premium">
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  No action items found. Record journal entries to extract actions.
                </p>
                <Link href="/coach?tab=diary&record=true">
                  <Button variant="link" className="mt-2">Record an Entry</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}

function ActionItemRow({
  item,
  isSelected,
  onToggleSelect,
  onApprove,
  onReject,
  onMoveToPending,
}: {
  item: CoachActionItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onMoveToPending: (id: string, prevStatus: CoachActionItem['status']) => void;
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg transition-colors',
      item.status === 'pending' ? 'bg-warning/5 hover:bg-warning/10' :
      item.status === 'approved' ? 'bg-primary/5 hover:bg-primary/10' :
      item.status === 'rejected' ? 'bg-destructive/5' :
      item.status === 'synced' ? 'bg-success/5' :
      'bg-muted/50 hover:bg-muted'
    )}>
      {item.status === 'pending' && (
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
      )}
      {item.status === 'synced' && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
      {item.status === 'approved' && <Clock className="h-4 w-4 text-primary shrink-0" />}
      {item.status === 'rejected' && <X className="h-4 w-4 text-destructive shrink-0" />}

      <div className="flex-1 min-w-0">
        <p className={cn('font-medium text-sm', item.status === 'rejected' && 'line-through text-muted-foreground')}>
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-[10px] capitalize gap-1">
            {getActionTypeIcon(item.action_type)}
            {item.action_type}
          </Badge>
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px] capitalize',
              item.priority === 'critical' && 'bg-destructive/20 text-destructive',
              item.priority === 'high' && 'bg-warning/20 text-warning'
            )}
          >
            {item.priority}
          </Badge>
          {item.category && (
            <Badge variant="secondary" className="text-[10px] capitalize">{item.category}</Badge>
          )}
          {item.due_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(parseISO(item.due_date), 'MMM d')}
            </span>
          )}
        </div>
      </div>

      {item.status === 'synced' && item.linked_plan_entity_id && (
        <Link href={`/plan?tab=tasks&highlight=${item.linked_plan_entity_id}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View in Plan
          </Button>
        </Link>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {item.status === 'pending' && (
            <>
              <DropdownMenuItem onClick={() => onApprove(item.id)}>
                <Check className="h-4 w-4 mr-2" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onReject(item.id)}>
                <X className="h-4 w-4 mr-2" />
                Reject
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {(item.status === 'approved' || item.status === 'rejected') && (
            <>
              <DropdownMenuItem onClick={() => onMoveToPending(item.id, item.status)}>
                <Clock className="h-4 w-4 mr-2" />
                Move to Pending
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function getActionTypeIcon(type: ActionType): React.ReactNode {
  const icons: Record<ActionType, React.ReactNode> = {
    task: <CheckCircle2 className="h-3 w-3" />,
    reminder: <Clock className="h-3 w-3" />,
    meeting: <Calendar className="h-3 w-3" />,
    goal: <Target className="h-3 w-3" />,
    habit: <Repeat className="h-3 w-3" />,
    prayer_plan: <Sparkles className="h-3 w-3" />,
    reflection_followup: <ArrowRight className="h-3 w-3" />,
  };
  return icons[type];
}
