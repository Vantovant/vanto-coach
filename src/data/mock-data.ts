import type {
  CoachSession,
  CoachMemory,
  CoachActionItem,
  CoachDailyBriefing,
  CoachInsight,
  BibleBook,
  PrayerRequest,
  CoachSettings,
  TopicalScripture,
} from '@/types/coach';

// ============================================
// MOCK SESSIONS
// ============================================

export const mockSessions: CoachSession[] = [
  {
    id: 'session-1',
    user_id: 'user-1',
    title: 'Morning reflection on leadership challenges',
    session_date: '2026-03-18',
    audio_url: '/audio/session-1.webm',
    audio_duration_seconds: 324,
    raw_transcript: `Lord, I'm feeling overwhelmed this morning. There's so much on my plate with the new project launch and the team seems to be struggling. I know I need to delegate more but I keep wanting to control everything. Yesterday's meeting didn't go well - I lost my temper when John pushed back on the timeline. I need to apologize. I've been neglecting my morning devotions and I think that's affecting everything. Help me to lead with grace. I'm grateful for my wife's support through all of this. She prayed for me last night and it meant so much.`,
    cleaned_transcript: `Feeling overwhelmed with the new project launch. Team is struggling. Need to delegate more but tendency to control everything. Lost temper with John over timeline - need to apologize. Neglecting morning devotions. Grateful for wife's prayer support.`,
    summary: 'Leadership stress and delegation challenges, combined with spiritual discipline slipping. Recognition of need for grace-filled leadership and the importance of devotional time.',
    mood: 'overwhelmed',
    sentiment_score: -0.3,
    life_areas: ['leadership', 'faith', 'relationships', 'business'],
    spiritual_topics: ['prayer', 'guidance', 'repentance', 'gratitude'],
    coach_response: `I hear your heart in this reflection. The awareness you have - recognizing the connection between your spiritual disciplines and your leadership capacity - is itself a mark of mature faith. The incident with John is an opportunity for growth, not just an apology, but a chance to model Christ-like humility to your team. Consider: what would it look like to not just apologize, but to invite John into the solution? Your wife's prayer support is a gift - receive it fully.`,
    biblical_response: {
      primary_verse: {
        book: 'Proverbs',
        chapter: 16,
        verse_start: 32,
        text: 'He that is slow to anger is better than the mighty; and he that ruleth his spirit than he that taketh a city.',
        translation: 'KJV'
      },
      supporting_verses: [
        {
          book: 'James',
          chapter: 1,
          verse_start: 19,
          verse_end: 20,
          text: 'Wherefore, my beloved brethren, let every man be swift to hear, slow to speak, slow to wrath: For the wrath of man worketh not the righteousness of God.',
          translation: 'KJV'
        },
        {
          book: 'Galatians',
          chapter: 5,
          verse_start: 22,
          verse_end: 23,
          text: 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, Meekness, temperance: against such there is no law.',
          translation: 'KJV'
        }
      ],
      explanation: 'Self-control in leadership is not weakness - it is spiritual strength. The ability to rule your spirit under pressure demonstrates the fruit of the Holy Spirit working in you.',
      application: 'Before responding in meetings, take a breath and silently pray. Create space between stimulus and response.',
      prayer: 'Lord, fill me with Your Spirit of patience and self-control. Help me to lead as You would lead - with grace under pressure. Give me the humility to apologize and the wisdom to delegate. In Jesus\' name, Amen.',
      reflection_question: 'What would change if you approached each team interaction as a ministry opportunity rather than a management task?',
      action_step: 'Schedule a private meeting with John today to apologize and seek his input on the timeline.'
    },
    action_status: 'extracted',
    structured_entry: {
      wins: [],
      struggles: ['Controlling tendency', 'Lost temper with team member', 'Neglecting devotions'],
      fears: ['Project failure', 'Being seen as weak leader'],
      decisions: ['Need to apologize to John', 'Need to delegate more'],
      people: ['John', 'Wife'],
      opportunities: ['Model humility to team'],
      gratitude: ["Wife's prayer support"],
      followups: ['Apologize to John', 'Restart morning devotions'],
      prayer_requests: ['Leadership grace', 'Self-control'],
      scripture_reflections: [],
      habits: ['Morning devotions (struggling)'],
      finances: [],
      health: [],
      calling: ['Lead with grace'],
      relationships: ['Wife - supportive', 'John - tension'],
      leadership: ['Delegation challenge', 'Temper management']
    },
    created_at: '2026-03-18T06:30:00Z',
    updated_at: '2026-03-18T06:45:00Z',
    deleted_at: null
  },
  {
    id: 'session-2',
    user_id: 'user-1',
    title: 'Evening gratitude and reflection',
    session_date: '2026-03-17',
    audio_url: '/audio/session-2.webm',
    audio_duration_seconds: 187,
    raw_transcript: `What a day, Lord. I spoke with John and it went better than I expected. He actually appreciated my honesty and we found a compromise on the timeline. I felt Your presence guiding that conversation. The team meeting afterward had a different energy. I'm learning that vulnerability doesn't diminish authority - it builds trust. Sarah mentioned she's been watching how I handle pressure. That's sobering. Lord, help me to be a worthy example. I'm tired but grateful tonight.`,
    cleaned_transcript: `Apologized to John - went well. Found timeline compromise. Team meeting had positive energy afterward. Learning that vulnerability builds trust. Sarah is watching how I handle pressure. Tired but grateful.`,
    summary: 'Positive resolution with John, discovering that vulnerability strengthens rather than weakens leadership authority. Awareness of being watched as an example.',
    mood: 'grateful',
    sentiment_score: 0.7,
    life_areas: ['leadership', 'relationships', 'growth'],
    spiritual_topics: ['gratitude', 'testimony', 'calling'],
    coach_response: `This is a breakthrough moment worth marking. You acted on conviction, and God honored it. The insight about vulnerability and authority is profound - this is leadership formation happening in real-time. Sarah's observation is a reminder that leadership is always being witnessed. Rest well tonight knowing you walked in obedience today.`,
    biblical_response: {
      primary_verse: {
        book: '1 Timothy',
        chapter: 4,
        verse_start: 12,
        text: 'Let no man despise thy youth; but be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity.',
        translation: 'KJV'
      },
      supporting_verses: [
        {
          book: 'Matthew',
          chapter: 5,
          verse_start: 16,
          text: 'Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.',
          translation: 'KJV'
        }
      ],
      explanation: 'Being watched is not a burden but a calling. Your example can lead others to glorify God.',
      application: 'Continue to walk in integrity, knowing that your leadership is a testimony.',
      prayer: 'Thank You, Lord, for this victory. Help me to remain humble and to continue growing as a leader and example. Amen.',
      reflection_question: 'How might God be using your leadership journey to disciple others?',
      action_step: 'Journal this breakthrough and the lessons learned.'
    },
    action_status: 'none',
    structured_entry: {
      wins: ['Apologized to John successfully', 'Team energy improved', 'Learned vulnerability builds trust'],
      struggles: [],
      fears: [],
      decisions: [],
      people: ['John', 'Sarah'],
      opportunities: ['Be an example to Sarah and team'],
      gratitude: ['God\'s guidance in conversation', 'John\'s receptiveness', 'Learning moment'],
      followups: [],
      prayer_requests: ['Be a worthy example'],
      scripture_reflections: [],
      habits: [],
      finances: [],
      health: ['Tired'],
      calling: ['Leadership as ministry'],
      relationships: ['John - restored', 'Sarah - watching'],
      leadership: ['Vulnerability builds trust']
    },
    created_at: '2026-03-17T21:00:00Z',
    updated_at: '2026-03-17T21:15:00Z',
    deleted_at: null
  },
  {
    id: 'session-3',
    user_id: 'user-1',
    title: 'Financial stress and provision',
    session_date: '2026-03-15',
    audio_url: '/audio/session-3.webm',
    audio_duration_seconds: 256,
    raw_transcript: `Father, I'm worried about our finances. The client payment is late again and we're stretched thin this month. I don't want to tell my wife how bad it is. I know You're our provider but I'm struggling to trust right now. The kids need school supplies and I feel like I'm failing them. Help me to trust You. I keep thinking about that verse about not being anxious. I need to remember Your faithfulness in the past - You've never let us down.`,
    cleaned_transcript: `Worried about finances - client payment late, stretched thin. Haven't told wife the full picture. Kids need school supplies. Struggling to trust God's provision. Remembering past faithfulness.`,
    summary: 'Financial pressure causing anxiety and struggle to trust God\'s provision. Hiding the full situation from spouse. Need to remember past faithfulness.',
    mood: 'anxious',
    sentiment_score: -0.4,
    life_areas: ['finances', 'faith', 'family'],
    spiritual_topics: ['provision', 'trust', 'faith'],
    coach_response: `Financial pressure is one of the deepest tests of faith, and your honesty here is the first step toward breakthrough. However, I want to gently challenge you: hiding the situation from your wife may feel protective, but it isolates you both. She is your partner - bringing her in creates space for shared faith and shared wisdom. Your children need to see their parents trusting God together, not a father carrying the burden alone.`,
    biblical_response: {
      primary_verse: {
        book: 'Philippians',
        chapter: 4,
        verse_start: 19,
        text: 'But my God shall supply all your need according to his riches in glory by Christ Jesus.',
        translation: 'KJV'
      },
      supporting_verses: [
        {
          book: 'Matthew',
          chapter: 6,
          verse_start: 31,
          verse_end: 33,
          text: 'Therefore take no thought, saying, What shall we eat? or, What shall we drink? or, Wherewithal shall we be clothed? For your heavenly Father knoweth that ye have need of all these things. But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
          translation: 'KJV'
        }
      ],
      explanation: 'God\'s provision is not based on your ability to earn, but on His riches in glory. Your job is to seek Him; His job is to provide.',
      application: 'Make a list of past provisions - times when God came through. Use this as fuel for faith.',
      prayer: 'Lord, You are Jehovah Jireh, my Provider. I release this financial burden to You. Give me wisdom in managing what You\'ve given and faith to trust for what is needed. Help me to be honest with my wife and to lead our family in faith. Amen.',
      reflection_question: 'What has God already provided that you may be taking for granted?',
      action_step: 'Have an honest conversation with your wife about the finances tonight.'
    },
    action_status: 'extracted',
    structured_entry: {
      wins: [],
      struggles: ['Financial stress', 'Not being transparent with wife', 'Struggling to trust'],
      fears: ['Failing family', 'Not being able to provide'],
      decisions: ['Need to talk to wife'],
      people: ['Wife', 'Kids'],
      opportunities: ['Model faith to family'],
      gratitude: ['Past provisions'],
      followups: ['Talk to wife about finances', 'Follow up on client payment'],
      prayer_requests: ['Financial provision', 'Trust in God'],
      scripture_reflections: ['Philippians 4:19'],
      habits: [],
      finances: ['Client payment late', 'Budget stretched', 'Kids school supplies needed'],
      health: [],
      calling: [],
      relationships: ['Hiding from wife'],
      leadership: []
    },
    created_at: '2026-03-15T07:00:00Z',
    updated_at: '2026-03-15T07:20:00Z',
    deleted_at: null
  }
];

// ============================================
// MOCK MEMORIES
// ============================================

export const mockMemories: CoachMemory[] = [
  {
    id: 'memory-1',
    user_id: 'user-1',
    memory_type: 'recurring_struggle',
    title: 'Tendency to control rather than delegate',
    summary: 'Recurring pattern of taking on too much personally instead of empowering team members. Often linked to fear of failure or perfectionism.',
    confidence: 85,
    first_seen_at: '2026-02-01T00:00:00Z',
    last_seen_at: '2026-03-18T00:00:00Z',
    occurrence_count: 7,
    related_session_ids: ['session-1'],
    scripture_refs: [
      {
        book: 'Exodus',
        chapter: 18,
        verse_start: 18,
        text: 'Thou wilt surely wear away, both thou, and this people that is with thee: for this thing is too heavy for thee; thou art not able to perform it thyself alone.',
        translation: 'KJV'
      }
    ],
    suggested_actions: [
      'Identify one task this week to fully delegate',
      'Schedule weekly 1:1s focused on empowerment',
      'Practice saying "What do you think?" before giving direction'
    ],
    growth_indicators: [
      {
        area: 'leadership',
        direction: 'improving',
        evidence: 'Recent apology to John shows growing self-awareness',
        since: '2026-03-17'
      }
    ],
    is_pinned: true,
    is_archived: false,
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-03-18T00:00:00Z'
  },
  {
    id: 'memory-2',
    user_id: 'user-1',
    memory_type: 'pattern_spiritual',
    title: 'Morning devotion consistency impacts daily performance',
    summary: 'Clear correlation between morning spiritual disciplines and emotional regulation, decision quality, and leadership effectiveness throughout the day.',
    confidence: 92,
    first_seen_at: '2026-01-15T00:00:00Z',
    last_seen_at: '2026-03-18T00:00:00Z',
    occurrence_count: 12,
    related_session_ids: ['session-1'],
    scripture_refs: [
      {
        book: 'Psalm',
        chapter: 5,
        verse_start: 3,
        text: 'My voice shalt thou hear in the morning, O LORD; in the morning will I direct my prayer unto thee, and will look up.',
        translation: 'KJV'
      }
    ],
    suggested_actions: [
      'Set non-negotiable devotion time before any work',
      'Prepare devotion materials the night before',
      'Start with just 10 minutes if feeling overwhelmed'
    ],
    growth_indicators: [
      {
        area: 'faith',
        direction: 'stable',
        evidence: 'Awareness of the pattern is consistent',
        since: '2026-01-15'
      }
    ],
    is_pinned: true,
    is_archived: false,
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-03-18T00:00:00Z'
  },
  {
    id: 'memory-3',
    user_id: 'user-1',
    memory_type: 'recurring_victory',
    title: 'Strong marriage support system',
    summary: 'Wife consistently provides prayer support and encouragement during difficult seasons. Marriage is a key source of strength.',
    confidence: 95,
    first_seen_at: '2025-12-01T00:00:00Z',
    last_seen_at: '2026-03-18T00:00:00Z',
    occurrence_count: 15,
    related_session_ids: ['session-1'],
    scripture_refs: [
      {
        book: 'Ecclesiastes',
        chapter: 4,
        verse_start: 9,
        verse_end: 10,
        text: 'Two are better than one; because they have a good reward for their labour. For if they fall, the one will lift up his fellow.',
        translation: 'KJV'
      }
    ],
    suggested_actions: [
      'Express gratitude to wife regularly',
      'Schedule weekly couple prayer time',
      'Share wins and struggles openly'
    ],
    growth_indicators: [
      {
        area: 'relationships',
        direction: 'stable',
        evidence: 'Consistent gratitude expressed',
        since: '2025-12-01'
      }
    ],
    is_pinned: false,
    is_archived: false,
    created_at: '2025-12-01T00:00:00Z',
    updated_at: '2026-03-18T00:00:00Z'
  },
  {
    id: 'memory-4',
    user_id: 'user-1',
    memory_type: 'pattern_behavior',
    title: 'Temper under deadline pressure',
    summary: 'Pattern of shorter patience and sharper responses when under project deadlines. Usually followed by regret and need to apologize.',
    confidence: 78,
    first_seen_at: '2026-01-20T00:00:00Z',
    last_seen_at: '2026-03-18T00:00:00Z',
    occurrence_count: 4,
    related_session_ids: ['session-1'],
    scripture_refs: [
      {
        book: 'Proverbs',
        chapter: 14,
        verse_start: 29,
        text: 'He that is slow to wrath is of great understanding: but he that is hasty of spirit exalteth folly.',
        translation: 'KJV'
      }
    ],
    suggested_actions: [
      'Build buffer time into project schedules',
      'Practice 10-second pause before responding under stress',
      'Identify early warning signs of rising frustration'
    ],
    growth_indicators: [
      {
        area: 'emotions',
        direction: 'improving',
        evidence: 'Quick apology and repair with John',
        since: '2026-03-17'
      }
    ],
    is_pinned: false,
    is_archived: false,
    created_at: '2026-01-20T00:00:00Z',
    updated_at: '2026-03-18T00:00:00Z'
  }
];

// ============================================
// MOCK ACTION ITEMS
// ============================================

export const mockActionItems: CoachActionItem[] = [
  {
    id: 'action-1',
    user_id: 'user-1',
    session_id: 'session-1',
    action_type: 'task',
    title: 'Apologize to John about timeline discussion',
    description: 'Schedule a private meeting to apologize for losing temper and seek collaborative solution.',
    priority: 'high',
    due_date: '2026-03-18',
    category: 'leadership',
    linked_plan_entity_id: null,
    linked_plan_entity_type: null,
    source: 'coach_extract',
    status: 'synced',
    dedupe_key: 'user-1|apologize-john|2026-03-18',
    created_at: '2026-03-18T06:45:00Z',
    updated_at: '2026-03-18T06:45:00Z'
  },
  {
    id: 'action-2',
    user_id: 'user-1',
    session_id: 'session-1',
    action_type: 'habit',
    title: 'Restart morning devotions',
    description: '15 minutes of prayer and Bible reading before work.',
    priority: 'critical',
    due_date: null,
    category: 'faith',
    linked_plan_entity_id: null,
    linked_plan_entity_type: null,
    source: 'coach_extract',
    status: 'approved',
    dedupe_key: 'user-1|morning-devotions|habit',
    created_at: '2026-03-18T06:45:00Z',
    updated_at: '2026-03-18T06:45:00Z'
  },
  {
    id: 'action-3',
    user_id: 'user-1',
    session_id: 'session-3',
    action_type: 'task',
    title: 'Have honest conversation with wife about finances',
    description: 'Share the full financial picture and pray together.',
    priority: 'high',
    due_date: '2026-03-15',
    category: 'family',
    linked_plan_entity_id: null,
    linked_plan_entity_type: null,
    source: 'coach_extract',
    status: 'pending',
    dedupe_key: 'user-1|talk-wife-finances|2026-03-15',
    created_at: '2026-03-15T07:20:00Z',
    updated_at: '2026-03-15T07:20:00Z'
  },
  {
    id: 'action-4',
    user_id: 'user-1',
    session_id: 'session-3',
    action_type: 'task',
    title: 'Follow up on late client payment',
    description: 'Send a polite but firm follow-up on the overdue invoice.',
    priority: 'high',
    due_date: '2026-03-16',
    category: 'finances',
    linked_plan_entity_id: null,
    linked_plan_entity_type: null,
    source: 'coach_extract',
    status: 'pending',
    dedupe_key: 'user-1|client-payment|2026-03-16',
    created_at: '2026-03-15T07:20:00Z',
    updated_at: '2026-03-15T07:20:00Z'
  }
];

// ============================================
// MOCK DAILY BRIEFING
// ============================================

export const mockDailyBriefing: CoachDailyBriefing = {
  id: 'briefing-1',
  user_id: 'user-1',
  briefing_date: '2026-03-18',
  greeting: 'Good morning. You\'ve walked through fire this week and emerged with wisdom. Let\'s build on yesterday\'s breakthrough.',
  todays_focus: 'Lead with the same vulnerability that restored your relationship with John. Your team is watching and learning.',
  spiritual_focus: 'Spend your morning devotion time in gratitude. Acknowledge God\'s guidance in yesterday\'s difficult conversation.',
  top_action_items: [
    {
      title: 'Complete morning devotions',
      priority: 'critical',
      category: 'faith',
      due_date: null
    },
    {
      title: 'Follow up on client payment',
      priority: 'high',
      category: 'finances',
      due_date: '2026-03-18'
    },
    {
      title: 'Delegate one task fully to team member',
      priority: 'medium',
      category: 'leadership',
      due_date: '2026-03-18'
    }
  ],
  prayer_focus: {
    theme: 'Continued growth in self-control and servant leadership',
    areas: ['Leadership grace', 'Financial provision', 'Family unity'],
    scripture: {
      book: 'Proverbs',
      chapter: 3,
      verse_start: 5,
      verse_end: 6,
      text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.',
      translation: 'KJV'
    }
  },
  scripture_for_today: {
    book: 'Colossians',
    chapter: 3,
    verse_start: 23,
    verse_end: 24,
    text: 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men; Knowing that of the Lord ye shall receive the reward of the inheritance: for ye serve the Lord Christ.',
    translation: 'KJV'
  },
  pattern_insight: 'Your best days this month have started with intentional spiritual time. Make that the non-negotiable foundation.',
  linked_tasks: [
    { id: 'task-1', title: 'Review project timeline', type: 'task', due_date: '2026-03-18', priority: 'high' },
    { id: 'task-2', title: 'Prepare team update presentation', type: 'task', due_date: '2026-03-19', priority: 'medium' }
  ],
  linked_reminders: [
    { id: 'rem-1', title: 'Team standup', type: 'reminder', due_date: '2026-03-18T09:00:00Z' }
  ],
  linked_meetings: [
    { id: 'meet-1', title: 'Client check-in call', type: 'meeting', due_date: '2026-03-18T14:00:00Z' }
  ],
  created_at: '2026-03-18T05:00:00Z'
};

// ============================================
// MOCK PRAYER REQUESTS
// ============================================

export const mockPrayerRequests: PrayerRequest[] = [
  {
    id: 'prayer-1',
    user_id: 'user-1',
    title: 'Client payment to come through',
    description: 'Praying for the late payment to be resolved so we can meet family needs.',
    category: 'provision',
    status: 'active',
    first_prayed_at: '2026-03-15T00:00:00Z',
    last_prayed_at: '2026-03-18T00:00:00Z',
    answered_at: null,
    answer_testimony: null,
    related_session_ids: ['session-3'],
    scripture_refs: [
      {
        book: 'Philippians',
        chapter: 4,
        verse_start: 19,
        text: 'But my God shall supply all your need according to his riches in glory by Christ Jesus.',
        translation: 'KJV'
      }
    ],
    created_at: '2026-03-15T00:00:00Z',
    updated_at: '2026-03-18T00:00:00Z'
  },
  {
    id: 'prayer-2',
    user_id: 'user-1',
    title: 'Growth in self-control under pressure',
    description: 'Asking God for patience and wisdom in high-pressure situations.',
    category: 'personal',
    status: 'continuing',
    first_prayed_at: '2026-01-20T00:00:00Z',
    last_prayed_at: '2026-03-18T00:00:00Z',
    answered_at: null,
    answer_testimony: null,
    related_session_ids: ['session-1'],
    scripture_refs: [
      {
        book: 'Galatians',
        chapter: 5,
        verse_start: 22,
        verse_end: 23,
        text: 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, Meekness, temperance: against such there is no law.',
        translation: 'KJV'
      }
    ],
    created_at: '2026-01-20T00:00:00Z',
    updated_at: '2026-03-18T00:00:00Z'
  }
];

// ============================================
// MOCK INSIGHTS
// ============================================

export const mockInsights: CoachInsight[] = [
  {
    id: 'insight-1',
    user_id: 'user-1',
    insight_type: 'weekly_review',
    period_start: '2026-03-11',
    period_end: '2026-03-18',
    title: 'Week of Breakthrough Leadership',
    summary: 'This week marked a turning point in leadership maturity. The willingness to apologize and embrace vulnerability led to a measurable shift in team dynamics.',
    key_observations: [
      'Correlation between devotion time and emotional regulation confirmed',
      'Vulnerability with John led to improved collaboration',
      'Financial stress is affecting sleep and decision-making',
      'Wife\'s support remains a critical strength'
    ],
    growth_areas: [
      { area: 'leadership', score: 72, trend: 'up', insight: 'Significant growth in humility and vulnerability' },
      { area: 'faith', score: 65, trend: 'stable', insight: 'Awareness of need for devotion consistency' },
      { area: 'finances', score: 45, trend: 'down', insight: 'External pressure causing stress' },
      { area: 'relationships', score: 80, trend: 'up', insight: 'Marriage strong, team relationships improving' }
    ],
    challenges: [
      'Financial pressure from late client payment',
      'Tendency to hide stress from spouse',
      'Inconsistent morning routine'
    ],
    recommendations: [
      'Establish non-negotiable 15-minute morning devotion',
      'Have transparent financial conversation with wife',
      'Build 10-second pause practice into meeting preparation'
    ],
    scripture_focus: [
      {
        book: 'Proverbs',
        chapter: 3,
        verse_start: 5,
        verse_end: 6,
        text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.',
        translation: 'KJV'
      }
    ],
    next_steps: [
      'Complete honest financial conversation by Friday',
      'Delegate one significant task this week',
      'Schedule date night with wife'
    ],
    mood_trend: {
      dominant_mood: 'reflective',
      variance: 0.6,
      positive_days: 4,
      challenging_days: 3
    },
    life_balance: {
      faith: 65,
      family: 75,
      health: 60,
      finances: 45,
      business: 70,
      relationships: 78,
      rest: 55,
      growth: 72
    },
    created_at: '2026-03-18T00:00:00Z'
  }
];

// ============================================
// MOCK SETTINGS
// ============================================

export const mockSettings: CoachSettings = {
  user_id: 'user-1',
  coaching_tone: 'balanced',
  scripture_translation: 'KJV',
  memory_retention_days: 365,
  auto_extract_actions: true,
  pastoral_mode: true,
  pentecostal_guidance: true,
  transcription_language: 'en-US',
  daily_briefing_time: '06:00',
  prayer_reminder_enabled: true,
  updated_at: '2026-03-18T00:00:00Z'
};

// ============================================
// BIBLE BOOKS
// ============================================

export const bibleBooks: BibleBook[] = [
  { id: 'gen', name: 'Genesis', abbreviation: 'Gen', testament: 'old', chapters: 50 },
  { id: 'exo', name: 'Exodus', abbreviation: 'Exo', testament: 'old', chapters: 40 },
  { id: 'lev', name: 'Leviticus', abbreviation: 'Lev', testament: 'old', chapters: 27 },
  { id: 'num', name: 'Numbers', abbreviation: 'Num', testament: 'old', chapters: 36 },
  { id: 'deu', name: 'Deuteronomy', abbreviation: 'Deu', testament: 'old', chapters: 34 },
  { id: 'jos', name: 'Joshua', abbreviation: 'Jos', testament: 'old', chapters: 24 },
  { id: 'jdg', name: 'Judges', abbreviation: 'Jdg', testament: 'old', chapters: 21 },
  { id: 'rut', name: 'Ruth', abbreviation: 'Rut', testament: 'old', chapters: 4 },
  { id: '1sa', name: '1 Samuel', abbreviation: '1Sa', testament: 'old', chapters: 31 },
  { id: '2sa', name: '2 Samuel', abbreviation: '2Sa', testament: 'old', chapters: 24 },
  { id: '1ki', name: '1 Kings', abbreviation: '1Ki', testament: 'old', chapters: 22 },
  { id: '2ki', name: '2 Kings', abbreviation: '2Ki', testament: 'old', chapters: 25 },
  { id: '1ch', name: '1 Chronicles', abbreviation: '1Ch', testament: 'old', chapters: 29 },
  { id: '2ch', name: '2 Chronicles', abbreviation: '2Ch', testament: 'old', chapters: 36 },
  { id: 'ezr', name: 'Ezra', abbreviation: 'Ezr', testament: 'old', chapters: 10 },
  { id: 'neh', name: 'Nehemiah', abbreviation: 'Neh', testament: 'old', chapters: 13 },
  { id: 'est', name: 'Esther', abbreviation: 'Est', testament: 'old', chapters: 10 },
  { id: 'job', name: 'Job', abbreviation: 'Job', testament: 'old', chapters: 42 },
  { id: 'psa', name: 'Psalms', abbreviation: 'Psa', testament: 'old', chapters: 150 },
  { id: 'pro', name: 'Proverbs', abbreviation: 'Pro', testament: 'old', chapters: 31 },
  { id: 'ecc', name: 'Ecclesiastes', abbreviation: 'Ecc', testament: 'old', chapters: 12 },
  { id: 'sng', name: 'Song of Solomon', abbreviation: 'Sng', testament: 'old', chapters: 8 },
  { id: 'isa', name: 'Isaiah', abbreviation: 'Isa', testament: 'old', chapters: 66 },
  { id: 'jer', name: 'Jeremiah', abbreviation: 'Jer', testament: 'old', chapters: 52 },
  { id: 'lam', name: 'Lamentations', abbreviation: 'Lam', testament: 'old', chapters: 5 },
  { id: 'eze', name: 'Ezekiel', abbreviation: 'Eze', testament: 'old', chapters: 48 },
  { id: 'dan', name: 'Daniel', abbreviation: 'Dan', testament: 'old', chapters: 12 },
  { id: 'hos', name: 'Hosea', abbreviation: 'Hos', testament: 'old', chapters: 14 },
  { id: 'jol', name: 'Joel', abbreviation: 'Jol', testament: 'old', chapters: 3 },
  { id: 'amo', name: 'Amos', abbreviation: 'Amo', testament: 'old', chapters: 9 },
  { id: 'oba', name: 'Obadiah', abbreviation: 'Oba', testament: 'old', chapters: 1 },
  { id: 'jon', name: 'Jonah', abbreviation: 'Jon', testament: 'old', chapters: 4 },
  { id: 'mic', name: 'Micah', abbreviation: 'Mic', testament: 'old', chapters: 7 },
  { id: 'nah', name: 'Nahum', abbreviation: 'Nah', testament: 'old', chapters: 3 },
  { id: 'hab', name: 'Habakkuk', abbreviation: 'Hab', testament: 'old', chapters: 3 },
  { id: 'zep', name: 'Zephaniah', abbreviation: 'Zep', testament: 'old', chapters: 3 },
  { id: 'hag', name: 'Haggai', abbreviation: 'Hag', testament: 'old', chapters: 2 },
  { id: 'zec', name: 'Zechariah', abbreviation: 'Zec', testament: 'old', chapters: 14 },
  { id: 'mal', name: 'Malachi', abbreviation: 'Mal', testament: 'old', chapters: 4 },
  { id: 'mat', name: 'Matthew', abbreviation: 'Mat', testament: 'new', chapters: 28 },
  { id: 'mrk', name: 'Mark', abbreviation: 'Mrk', testament: 'new', chapters: 16 },
  { id: 'luk', name: 'Luke', abbreviation: 'Luk', testament: 'new', chapters: 24 },
  { id: 'jhn', name: 'John', abbreviation: 'Jhn', testament: 'new', chapters: 21 },
  { id: 'act', name: 'Acts', abbreviation: 'Act', testament: 'new', chapters: 28 },
  { id: 'rom', name: 'Romans', abbreviation: 'Rom', testament: 'new', chapters: 16 },
  { id: '1co', name: '1 Corinthians', abbreviation: '1Co', testament: 'new', chapters: 16 },
  { id: '2co', name: '2 Corinthians', abbreviation: '2Co', testament: 'new', chapters: 13 },
  { id: 'gal', name: 'Galatians', abbreviation: 'Gal', testament: 'new', chapters: 6 },
  { id: 'eph', name: 'Ephesians', abbreviation: 'Eph', testament: 'new', chapters: 6 },
  { id: 'php', name: 'Philippians', abbreviation: 'Php', testament: 'new', chapters: 4 },
  { id: 'col', name: 'Colossians', abbreviation: 'Col', testament: 'new', chapters: 4 },
  { id: '1th', name: '1 Thessalonians', abbreviation: '1Th', testament: 'new', chapters: 5 },
  { id: '2th', name: '2 Thessalonians', abbreviation: '2Th', testament: 'new', chapters: 3 },
  { id: '1ti', name: '1 Timothy', abbreviation: '1Ti', testament: 'new', chapters: 6 },
  { id: '2ti', name: '2 Timothy', abbreviation: '2Ti', testament: 'new', chapters: 4 },
  { id: 'tit', name: 'Titus', abbreviation: 'Tit', testament: 'new', chapters: 3 },
  { id: 'phm', name: 'Philemon', abbreviation: 'Phm', testament: 'new', chapters: 1 },
  { id: 'heb', name: 'Hebrews', abbreviation: 'Heb', testament: 'new', chapters: 13 },
  { id: 'jas', name: 'James', abbreviation: 'Jas', testament: 'new', chapters: 5 },
  { id: '1pe', name: '1 Peter', abbreviation: '1Pe', testament: 'new', chapters: 5 },
  { id: '2pe', name: '2 Peter', abbreviation: '2Pe', testament: 'new', chapters: 3 },
  { id: '1jn', name: '1 John', abbreviation: '1Jn', testament: 'new', chapters: 5 },
  { id: '2jn', name: '2 John', abbreviation: '2Jn', testament: 'new', chapters: 1 },
  { id: '3jn', name: '3 John', abbreviation: '3Jn', testament: 'new', chapters: 1 },
  { id: 'jud', name: 'Jude', abbreviation: 'Jud', testament: 'new', chapters: 1 },
  { id: 'rev', name: 'Revelation', abbreviation: 'Rev', testament: 'new', chapters: 22 }
];

// ============================================
// TOPICAL SCRIPTURES
// ============================================

export const topicalScriptures: TopicalScripture[] = [
  {
    topic: 'Anxiety & Peace',
    description: 'Finding peace in uncertain times',
    verses: [
      { book: 'Philippians', chapter: 4, verse_start: 6, verse_end: 7, text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.', translation: 'KJV' },
      { book: 'Isaiah', chapter: 26, verse_start: 3, text: 'Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.', translation: 'KJV' },
      { book: '1 Peter', chapter: 5, verse_start: 7, text: 'Casting all your care upon him; for he careth for you.', translation: 'KJV' }
    ]
  },
  {
    topic: 'Leadership & Wisdom',
    description: 'Guidance for those in authority',
    verses: [
      { book: 'Proverbs', chapter: 11, verse_start: 14, text: 'Where no counsel is, the people fall: but in the multitude of counsellors there is safety.', translation: 'KJV' },
      { book: 'James', chapter: 1, verse_start: 5, text: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.', translation: 'KJV' },
      { book: 'Proverbs', chapter: 16, verse_start: 3, text: 'Commit thy works unto the LORD, and thy thoughts shall be established.', translation: 'KJV' }
    ]
  },
  {
    topic: 'Financial Provision',
    description: 'Trusting God as provider',
    verses: [
      { book: 'Philippians', chapter: 4, verse_start: 19, text: 'But my God shall supply all your need according to his riches in glory by Christ Jesus.', translation: 'KJV' },
      { book: 'Matthew', chapter: 6, verse_start: 33, text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.', translation: 'KJV' },
      { book: 'Malachi', chapter: 3, verse_start: 10, text: 'Bring ye all the tithes into the storehouse, that there may be meat in mine house, and prove me now herewith, saith the LORD of hosts, if I will not open you the windows of heaven, and pour you out a blessing, that there shall not be room enough to receive it.', translation: 'KJV' }
    ]
  },
  {
    topic: 'Self-Control & Patience',
    description: 'Mastering emotions and impulses',
    verses: [
      { book: 'Proverbs', chapter: 16, verse_start: 32, text: 'He that is slow to anger is better than the mighty; and he that ruleth his spirit than he that taketh a city.', translation: 'KJV' },
      { book: 'Galatians', chapter: 5, verse_start: 22, verse_end: 23, text: 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, Meekness, temperance: against such there is no law.', translation: 'KJV' },
      { book: 'James', chapter: 1, verse_start: 19, text: 'Wherefore, my beloved brethren, let every man be swift to hear, slow to speak, slow to wrath.', translation: 'KJV' }
    ]
  },
  {
    topic: 'Purpose & Calling',
    description: 'Discovering God\'s plan for your life',
    verses: [
      { book: 'Jeremiah', chapter: 29, verse_start: 11, text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.', translation: 'KJV' },
      { book: 'Ephesians', chapter: 2, verse_start: 10, text: 'For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.', translation: 'KJV' },
      { book: 'Romans', chapter: 8, verse_start: 28, text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.', translation: 'KJV' }
    ]
  },
  {
    topic: 'Marriage & Family',
    description: 'Building strong relationships',
    verses: [
      { book: 'Ephesians', chapter: 5, verse_start: 25, text: 'Husbands, love your wives, even as Christ also loved the church, and gave himself for it.', translation: 'KJV' },
      { book: 'Proverbs', chapter: 31, verse_start: 10, text: 'Who can find a virtuous woman? for her price is far above rubies.', translation: 'KJV' },
      { book: 'Ecclesiastes', chapter: 4, verse_start: 9, verse_end: 10, text: 'Two are better than one; because they have a good reward for their labour. For if they fall, the one will lift up his fellow.', translation: 'KJV' }
    ]
  }
];

// ============================================
// SAMPLE BIBLE VERSES (KJV - Public Domain)
// ============================================

export const sampleBibleChapter = {
  book: 'Proverbs',
  chapter: 3,
  verses: [
    { book: 'Proverbs', chapter: 3, verse: 1, text: 'My son, forget not my law; but let thine heart keep my commandments:' },
    { book: 'Proverbs', chapter: 3, verse: 2, text: 'For length of days, and long life, and peace, shall they add to thee.' },
    { book: 'Proverbs', chapter: 3, verse: 3, text: 'Let not mercy and truth forsake thee: bind them about thy neck; write them upon the table of thine heart:' },
    { book: 'Proverbs', chapter: 3, verse: 4, text: 'So shalt thou find favour and good understanding in the sight of God and man.' },
    { book: 'Proverbs', chapter: 3, verse: 5, text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.' },
    { book: 'Proverbs', chapter: 3, verse: 6, text: 'In all thy ways acknowledge him, and he shall direct thy paths.' },
    { book: 'Proverbs', chapter: 3, verse: 7, text: 'Be not wise in thine own eyes: fear the LORD, and depart from evil.' },
    { book: 'Proverbs', chapter: 3, verse: 8, text: 'It shall be health to thy navel, and marrow to thy bones.' },
    { book: 'Proverbs', chapter: 3, verse: 9, text: 'Honour the LORD with thy substance, and with the firstfruits of all thine increase:' },
    { book: 'Proverbs', chapter: 3, verse: 10, text: 'So shall thy barns be filled with plenty, and thy presses shall burst out with new wine.' },
    { book: 'Proverbs', chapter: 3, verse: 11, text: 'My son, despise not the chastening of the LORD; neither be weary of his correction:' },
    { book: 'Proverbs', chapter: 3, verse: 12, text: 'For whom the LORD loveth he correcteth; even as a father the son in whom he delighteth.' },
    { book: 'Proverbs', chapter: 3, verse: 13, text: 'Happy is the man that findeth wisdom, and the man that getteth understanding.' },
    { book: 'Proverbs', chapter: 3, verse: 14, text: 'For the merchandise of it is better than the merchandise of silver, and the gain thereof than fine gold.' },
    { book: 'Proverbs', chapter: 3, verse: 15, text: 'She is more precious than rubies: and all the things thou canst desire are not to be compared unto her.' }
  ]
};
