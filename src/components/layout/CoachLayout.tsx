'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Sun,
  BookOpen,
  Brain,
  Target,
  BookMarked,
  Lightbulb,
  Settings,
  Menu,
  Sparkles,
  Mic,
  Command,
  LogOut,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import type { CoachTab } from '@/types/coach';
import { signOut } from '@/lib/supabase/auth';
import { useAuth } from '@/context/AuthContext';
import { trackBetaEvent } from '@/lib/supabase/analytics';

interface CoachLayoutProps {
  children: React.ReactNode;
}

const tabs: { id: CoachTab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'today', label: 'Today', icon: <Sun className="h-5 w-5" />, description: 'Daily coaching dashboard' },
  { id: 'diary', label: 'Diary', icon: <BookOpen className="h-5 w-5" />, description: 'Voice recordings & transcripts' },
  { id: 'memory', label: 'Memory', icon: <Brain className="h-5 w-5" />, description: 'Patterns & growth insights' },
  { id: 'action-plans', label: 'Action Plans', icon: <Target className="h-5 w-5" />, description: 'Tasks, goals & habits' },
  { id: 'scripture', label: 'Scripture', icon: <BookMarked className="h-5 w-5" />, description: 'Bible reader & wisdom' },
  { id: 'insights', label: 'Insights', icon: <Lightbulb className="h-5 w-5" />, description: 'Life coaching reports' },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, description: 'Preferences & privacy' },
];

export function CoachLayout({ children }: CoachLayoutProps) {
  const searchParams = useSearchParams();
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const { user } = useAuth();
  const currentTab = (searchParams.get('tab') as CoachTab) || 'today';
  const isAdmin = user?.email === 'vanto@onlinecourseformlm.com';

  const handleSignOut = async () => {
    await trackBetaEvent({ eventName: 'button_click', route: '/coach', actionName: 'sign_out' });
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <MobileNav currentTab={currentTab} isAdmin={isAdmin} onNavigate={() => setIsMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>

            <Link href="/coach" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-serif font-semibold tracking-tight">Vanto Coach</h1>
                <p className="text-[11px] text-muted-foreground -mt-0.5 tracking-wide">Executive Life Coach</p>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {tabs.slice(0, 6).map((tab) => (
              <Link
                key={tab.id}
                href={`/coach?tab=${tab.id}`}
                onClick={() => trackBetaEvent({ eventName: 'button_click', route: '/coach', tabName: tab.id, actionName: `nav_${tab.id}` })}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  currentTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {React.cloneElement(tab.icon as React.ReactElement, { className: 'h-4 w-4' })}
                <span className="hidden lg:inline">{tab.label}</span>
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin/beta-testers"
                onClick={() => trackBetaEvent({ eventName: 'button_click', route: '/coach', actionName: 'open_beta_console' })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden lg:inline">Beta Console</span>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <InstallPrompt />
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 text-muted-foreground">
              <Command className="h-3.5 w-3.5" />
              <span className="text-xs">K</span>
            </Button>
            <Link href="/coach?tab=diary&record=true" onClick={() => trackBetaEvent({ eventName: 'button_click', route: '/coach', actionName: 'record_from_header' })}>
              <Button variant="default" size="sm" className="gap-2">
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Record</span>
              </Button>
            </Link>
            <Link href="/coach?tab=settings" className="hidden md:block" onClick={() => trackBetaEvent({ eventName: 'button_click', route: '/coach', actionName: 'open_settings' })}>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            {user && (
              <Button variant="ghost" size="icon" className="text-muted-foreground hidden md:flex" onClick={handleSignOut} title={`Sign out (${user.email})`}>
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

function MobileNav({ currentTab, onNavigate, isAdmin }: { currentTab: CoachTab; onNavigate: () => void; isAdmin: boolean }) {
  return (
    <div className="p-4 space-y-2">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={`/coach?tab=${tab.id}`}
          onClick={() => {
            trackBetaEvent({ eventName: 'button_click', route: '/coach', tabName: tab.id, actionName: `mobile_nav_${tab.id}` });
            onNavigate();
          }}
          className={cn('flex items-center gap-3 rounded-lg px-3 py-3 text-sm', currentTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
        >
          {React.cloneElement(tab.icon as React.ReactElement, { className: 'h-4 w-4' })}
          <div>
            <div className="font-medium">{tab.label}</div>
            <div className="text-xs opacity-80">{tab.description}</div>
          </div>
        </Link>
      ))}
      {isAdmin && (
        <Link href="/admin/beta-testers" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-muted">
          <Shield className="h-4 w-4" />
          <div>
            <div className="font-medium">Beta Console</div>
            <div className="text-xs opacity-80">Admin analytics and invite codes</div>
          </div>
        </Link>
      )}
    </div>
  );
}
