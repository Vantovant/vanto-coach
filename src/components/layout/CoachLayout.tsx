'use client';

import * as React from 'react';
import Image from 'next/image';
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
  X,
  ChevronRight,
  Mic,
  Command,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CoachTab } from '@/types/coach';
import { signOut } from '@/lib/supabase/auth';
import { useAuth } from '@/context/AuthContext';

interface CoachLayoutProps {
  children: React.ReactNode;
}

const tabs: { id: CoachTab; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'today',
    label: 'Today',
    icon: <Sun className="h-5 w-5" />,
    description: 'Daily coaching dashboard',
  },
  {
    id: 'diary',
    label: 'Diary',
    icon: <BookOpen className="h-5 w-5" />,
    description: 'Voice recordings & transcripts',
  },
  {
    id: 'memory',
    label: 'Memory',
    icon: <Brain className="h-5 w-5" />,
    description: 'Patterns & growth insights',
  },
  {
    id: 'action-plans',
    label: 'Action Plans',
    icon: <Target className="h-5 w-5" />,
    description: 'Tasks, goals & habits',
  },
  {
    id: 'scripture',
    label: 'Scripture',
    icon: <BookMarked className="h-5 w-5" />,
    description: 'Bible reader & wisdom',
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: <Lightbulb className="h-5 w-5" />,
    description: 'Life coaching reports',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    description: 'Preferences & privacy',
  },
];

export function CoachLayout({ children }: CoachLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const currentTab = (searchParams.get('tab') as CoachTab) || 'today';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <MobileNav currentTab={currentTab} onNavigate={() => setIsMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>

            <Link href="/coach" className="flex items-center gap-3">
              <Image
                src="/icon-192.png"
                alt="Vanto Coach icon"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl border border-primary/10 bg-[hsl(var(--background))] object-contain"
              />
              <div className="hidden sm:block">
                <Image
                  src="/brand/vanto-coach-logo-horizontal.png"
                  alt="Vanto Coach — Executive Life Coach"
                  width={245}
                  height={82}
                  className="h-9 w-auto object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.slice(0, 6).map((tab) => (
              <Link
                key={tab.id}
                href={`/coach?tab=${tab.id}`}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  currentTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {React.cloneElement(tab.icon as React.ReactElement, { className: 'h-4 w-4' })}
                <span className="hidden lg:inline">{tab.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2 text-muted-foreground"
            >
              <Command className="h-3.5 w-3.5" />
              <span className="text-xs">K</span>
            </Button>
            <Link href="/coach?tab=diary&record=true">
              <Button variant="default" size="sm" className="gap-2">
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Record</span>
              </Button>
            </Link>
            <Link href="/coach?tab=settings" className="hidden md:block">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hidden md:flex"
                onClick={handleSignOut}
                title={`Sign out (${user.email})`}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav currentTab={currentTab} />
    </div>
  );
}

function MobileNav({ currentTab, onNavigate }: { currentTab: CoachTab; onNavigate: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <Image
          src="/icon-192.png"
          alt="Vanto Coach icon"
          width={40}
          height={40}
          className="h-10 w-10 rounded-xl border border-primary/10 bg-[hsl(var(--background))] object-contain"
        />
        <div>
          <Image
            src="/brand/vanto-coach-logo-horizontal.png"
            alt="Vanto Coach — Executive Life Coach"
            width={210}
            height={70}
            className="h-8 w-auto object-contain"
          />
        </div>
      </div>
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="flex flex-col gap-1">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/coach?tab=${tab.id}`}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                currentTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              {tab.icon}
              <div className="flex-1">
                <div className="font-medium">{tab.label}</div>
                <div className={cn(
                  'text-xs',
                  currentTab === tab.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
                )}>
                  {tab.description}
                </div>
              </div>
              <ChevronRight className={cn(
                'h-4 w-4',
                currentTab === tab.id ? 'text-primary-foreground/60' : 'text-muted-foreground/50'
              )} />
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          Powered by VantoOS
        </p>
      </div>
    </div>
  );
}

function MobileBottomNav({ currentTab }: { currentTab: CoachTab }) {
  const mobileTabsToShow = ['today', 'diary', 'scripture', 'insights', 'settings'] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileTabsToShow.map((tabId) => {
          const tab = tabs.find(t => t.id === tabId);
          if (!tab) return null;

          return (
            <Link
              key={tab.id}
              href={`/coach?tab=${tab.id}`}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]',
                currentTab === tab.id
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {React.cloneElement(tab.icon as React.ReactElement, {
                className: cn('h-5 w-5', currentTab === tab.id && 'text-primary')
              })}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
