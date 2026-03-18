'use client';

import * as React from 'react';
import {
  Settings,
  BookMarked,
  Mic,
  Brain,
  Shield,
  Bell,
  Download,
  Upload,
  Trash2,
  Info,
  ChevronRight,
  Sparkles,
  Heart,
  Moon,
  Sun,
  Monitor,
  Volume2,
  Globe,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { mockSettings } from '@/data/mock-data';
import type { CoachSettings, CoachingTone, BibleTranslation } from '@/types/coach';

export function SettingsTab() {
  const [settings, setSettings] = React.useState<CoachSettings>(mockSettings);

  const updateSetting = <K extends keyof CoachSettings>(key: K, value: CoachSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Customize your coaching experience and manage your data.
          </p>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Coaching Preferences */}
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[hsl(var(--spiritual))]" />
              <CardTitle className="text-base">Coaching Preferences</CardTitle>
            </div>
            <CardDescription>
              Adjust how your AI coach interacts with you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Coaching Tone</Label>
                <p className="text-sm text-muted-foreground">
                  How direct should coaching feedback be?
                </p>
              </div>
              <Select
                value={settings.coaching_tone}
                onValueChange={(v) => updateSetting('coaching_tone', v as CoachingTone)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gentle">Gentle</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="challenging">Challenging</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Pastoral Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Include pastoral care language and deeper spiritual support.
                </p>
              </div>
              <Switch
                checked={settings.pastoral_mode}
                onCheckedChange={(checked) => updateSetting('pastoral_mode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Pentecostal/Charismatic Guidance</Label>
                <p className="text-sm text-muted-foreground">
                  Include Spirit-led language, faith declarations, and charismatic perspective.
                </p>
              </div>
              <Switch
                checked={settings.pentecostal_guidance}
                onCheckedChange={(checked) => updateSetting('pentecostal_guidance', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto-Extract Actions</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically extract tasks and reminders from journal entries.
                </p>
              </div>
              <Switch
                checked={settings.auto_extract_actions}
                onCheckedChange={(checked) => updateSetting('auto_extract_actions', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Scripture Settings */}
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-accent" />
              <CardTitle className="text-base">Scripture Settings</CardTitle>
            </div>
            <CardDescription>
              Customize your Bible reading experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Bible Translation</Label>
                <p className="text-sm text-muted-foreground">
                  Default translation for scripture references.
                </p>
              </div>
              <Select
                value={settings.scripture_translation}
                onValueChange={(v) => updateSetting('scripture_translation', v as BibleTranslation)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KJV">KJV</SelectItem>
                  <SelectItem value="NKJV">NKJV</SelectItem>
                  <SelectItem value="NIV">NIV</SelectItem>
                  <SelectItem value="ESV">ESV</SelectItem>
                  <SelectItem value="NLT">NLT</SelectItem>
                  <SelectItem value="AMP">Amplified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Voice & Transcription */}
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Voice & Transcription</CardTitle>
            </div>
            <CardDescription>
              Configure voice recording and speech-to-text settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Transcription Language</Label>
                <p className="text-sm text-muted-foreground">
                  Primary language for speech recognition.
                </p>
              </div>
              <Select
                value={settings.transcription_language}
                onValueChange={(v) => updateSetting('transcription_language', v)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="en-GB">English (UK)</SelectItem>
                  <SelectItem value="en-ZA">English (SA)</SelectItem>
                  <SelectItem value="af-ZA">Afrikaans</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Memory & Privacy */}
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-[hsl(var(--spiritual))]" />
              <CardTitle className="text-base">Memory & Privacy</CardTitle>
            </div>
            <CardDescription>
              Control how your data is stored and used.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Memory Retention</Label>
                  <p className="text-sm text-muted-foreground">
                    How long to keep pattern memories ({settings.memory_retention_days} days)
                  </p>
                </div>
                <Slider
                  value={[settings.memory_retention_days]}
                  onValueChange={([value]) => updateSetting('memory_retention_days', value)}
                  min={30}
                  max={730}
                  step={30}
                  className="w-40"
                />
              </div>
            </div>

            <Separator />

            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Your data is protected</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>• Audio files are stored securely in private storage</li>
                <li>• All transcripts are encrypted at rest</li>
                <li>• AI processing happens with privacy-first architecture</li>
                <li>• You can export or delete all data at any time</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-warning" />
              <CardTitle className="text-base">Notifications</CardTitle>
            </div>
            <CardDescription>
              Configure alerts and reminders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Daily Briefing Time</Label>
                <p className="text-sm text-muted-foreground">
                  When to receive your morning coaching briefing.
                </p>
              </div>
              <Select
                value={settings.daily_briefing_time || 'none'}
                onValueChange={(v) => updateSetting('daily_briefing_time', v === 'none' ? null : v)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Disabled</SelectItem>
                  <SelectItem value="05:00">5:00 AM</SelectItem>
                  <SelectItem value="06:00">6:00 AM</SelectItem>
                  <SelectItem value="07:00">7:00 AM</SelectItem>
                  <SelectItem value="08:00">8:00 AM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Prayer Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Gentle reminders for prayer times.
                </p>
              </div>
              <Switch
                checked={settings.prayer_reminder_enabled}
                onCheckedChange={(checked) => updateSetting('prayer_reminder_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Data Management</CardTitle>
            </div>
            <CardDescription>
              Export or manage your data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export All Data
              </Button>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Import Data
              </Button>
            </div>

            <Separator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your
                    journal entries, audio recordings, memories, and coaching data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* VantoOS Integration */}
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">VantoOS Integration</CardTitle>
            </div>
            <CardDescription>
              Connect with VantoOS Plan for task synchronization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">VantoOS Plan</p>
                  <p className="text-sm text-muted-foreground">Tasks, reminders, and meetings sync</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-success/20 text-success">
                Connected
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="card-premium bg-muted/30">
          <CardContent className="p-6 text-center">
            <Sparkles className="h-10 w-10 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-1">Vanto Coach</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Executive Christian Life Coach
            </p>
            <p className="text-xs text-muted-foreground">
              Version 1.0.0 • Powered by VantoOS
            </p>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              This is coaching and spiritual guidance, not emergency or medical care.
              For urgent concerns, please consult appropriate professionals.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
