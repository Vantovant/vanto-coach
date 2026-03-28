'use client';

import { createClient } from './client';
import { captureMessage } from '@/lib/monitoring';

export type BetaEventName =
  | 'page_view'
  | 'tab_view'
  | 'button_click'
  | 'signup_started'
  | 'signup_succeeded'
  | 'signup_failed'
  | 'diary_record_started'
  | 'diary_processed'
  | 'today_viewed'
  | 'insights_viewed'
  | 'action_plans_viewed'
  | 'scripture_viewed';

export interface TrackEventInput {
  eventName: BetaEventName;
  route?: string | null;
  tabName?: string | null;
  actionName?: string | null;
  inviteCodeId?: string | null;
  metadata?: Record<string, unknown>;
}

const SESSION_STORAGE_KEY = 'vanto-beta-session-id';

function getClientSessionId() {
  if (typeof window === 'undefined') return null;
  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const created = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
  return created;
}

export async function trackBetaEvent(input: TrackEventInput) {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc('track_beta_event', {
      p_event_name: input.eventName,
      p_route: input.route ?? null,
      p_tab_name: input.tabName ?? null,
      p_action_name: input.actionName ?? null,
      p_invite_code_id: input.inviteCodeId ?? null,
      p_client_session_id: getClientSessionId(),
      p_metadata: input.metadata ?? {},
    });

    if (error) {
      captureMessage(`trackBetaEvent failed: ${error.message}`, 'warning', {
        context: 'analytics:trackBetaEvent',
        eventName: input.eventName,
        supabaseCode: error.code,
      });
    }
  } catch (error) {
    captureMessage('trackBetaEvent threw unexpectedly', 'warning', {
      context: 'analytics:trackBetaEvent',
      error: error instanceof Error ? error.message : String(error),
      eventName: input.eventName,
    });
  }
}
