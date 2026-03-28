/**
 * Golden fixtures for Today semantic evaluation harness.
 * Each fixture matches the exact input shape used by src/app/api/ai/today-coaching/route.ts
 * These are deterministic, local, and require no DB access.
 */

export interface TodayFixtureInput {
  latestMood: string;
  topAreas: string[];
  topTopics: string[];
  recentSummaries: string[];
  activePrayerCount: number;
  challenges: string[];
}

export interface GoldenFixture {
  name: string;
  scenario: string;
  input: TodayFixtureInput;
}

export const GOLDEN_FIXTURES: GoldenFixture[] = [
  {
    name: "boardroom-pressure",
    scenario: "CEO facing board vote on major restructuring amid investor distrust",
    input: {
      latestMood: "stressed",
      topAreas: ["leadership", "business", "faith"],
      topTopics: ["guidance", "wisdom", "trust"],
      recentSummaries: [
        "Board meeting in three days. Investors are pushing back hard on the restructuring plan. I feel like every decision I make is being second-guessed.",
        "Can't sleep. Keep replaying the Q3 numbers. Leadership team is divided and I don't know who to trust right now."
      ],
      activePrayerCount: 4,
      challenges: [
        "Board vote on restructuring in 3 days with divided investor sentiment",
        "Leadership team fracturing — two execs not aligned"
      ]
    }
  },
  {
    name: "staffing-stress",
    scenario: "Founder forced to let go of a trusted long-term employee due to runway pressure",
    input: {
      latestMood: "discouraged",
      topAreas: ["leadership", "relationships", "finances"],
      topTopics: ["forgiveness", "wisdom", "calling"],
      recentSummaries: [
        "Had to let Marcus go today. Five years together. He looked me in the eye and I had no words. I know it was the right call financially but it doesn't feel right spiritually.",
        "The team morale is at an all-time low. I'm carrying guilt and trying not to show it."
      ],
      activePrayerCount: 2,
      challenges: [
        "Let go of a 5-year employee due to runway pressure",
        "Team morale collapsed after layoff — rebuilding trust"
      ]
    }
  },
  {
    name: "financial-fear",
    scenario: "Business owner with 6 weeks of runway, waiting on a large contract decision",
    input: {
      latestMood: "anxious",
      topAreas: ["finances", "business", "faith"],
      topTopics: ["provision", "trust", "fear"],
      recentSummaries: [
        "Six weeks of runway. The Holloway contract still hasn't signed. Every morning I check my email first thing and feel sick.",
        "I know God has provided before. But this feels different. More exposed. I've never been this close to the edge."
      ],
      activePrayerCount: 6,
      challenges: [
        "6 weeks of operating runway remaining",
        "Key $300K contract unsigned and stalled"
      ]
    }
  },
  {
    name: "spiritual-dryness",
    scenario: "Executive who has been too busy to pray or read scripture for weeks",
    input: {
      latestMood: "neutral",
      topAreas: ["faith", "habits", "rest"],
      topTopics: ["prayer", "worship", "calling"],
      recentSummaries: [
        "Realized I haven't opened my Bible in 23 days. I know the motions but the fire is gone. Church felt like going through the motions.",
        "I'm doing all the right external things but I feel spiritually hollow. My team says I seem distant."
      ],
      activePrayerCount: 0,
      challenges: [
        "No consistent prayer practice in 3 weeks",
        "Feeling spiritually disconnected despite outward religious activity"
      ]
    }
  },
  {
    name: "family-strain-on-leadership",
    scenario: "COO whose teenage son is in crisis; work performance declining from home pressure",
    input: {
      latestMood: "overwhelmed",
      topAreas: ["family", "leadership", "emotions"],
      topTopics: ["healing", "guidance", "trust"],
      recentSummaries: [
        "Jaylen was arrested last night. Minor possession charge. I sat in that parking lot for an hour before walking into the house. Don't know how I showed up to the 8am all-hands.",
        "My wife and I are not on the same page about how to handle it. The home is tense. Work feels like a mask."
      ],
      activePrayerCount: 3,
      challenges: [
        "Teenage son arrested — family in crisis",
        "Marriage tension over how to respond; work performance at risk"
      ]
    }
  },
  {
    name: "pride-after-success",
    scenario: "Founder celebrating a big win but sensing spiritual pride creeping in",
    input: {
      latestMood: "joyful",
      topAreas: ["business", "faith", "calling"],
      topTopics: ["gratitude", "obedience", "testimony"],
      recentSummaries: [
        "Closed the Series A. $4.2M. The team went wild. I gave a great speech. But driving home alone I felt something off — like I was enjoying the credit too much.",
        "People keep calling me visionary. I like hearing it. That scares me."
      ],
      activePrayerCount: 1,
      challenges: [
        "Sensing pride in public recognition after funding close",
        "Struggle to attribute success to God rather than self in public"
      ]
    }
  },
  {
    name: "burnout-threshold",
    scenario: "Executive running on empty after 90-day sprint, resisting rest",
    input: {
      latestMood: "frustrated",
      topAreas: ["health", "rest", "habits"],
      topTopics: ["surrender", "trust", "healing"],
      recentSummaries: [
        "90 days without a full day off. My body is sending signals I keep ignoring. Headaches every afternoon. Snapping at people I love.",
        "I know I need to stop but I can't. The moment I slow down it feels like everything will collapse."
      ],
      activePrayerCount: 1,
      challenges: [
        "90 consecutive days without a rest day",
        "Believing rest is irresponsible — compulsive overwork pattern"
      ]
    }
  },
  {
    name: "calling-confusion",
    scenario: "Mid-career executive questioning whether to stay in business or pursue ministry",
    input: {
      latestMood: "confused",
      topAreas: ["calling", "purpose", "faith"],
      topTopics: ["calling", "obedience", "guidance"],
      recentSummaries: [
        "Got an offer to join a missions organization as COO. The salary is a third of what I make now. I felt more alive in that conversation than I have at my desk in two years.",
        "My pastor says stay where you are — you're a light in the marketplace. My wife says follow the pull. I don't know who's hearing God correctly."
      ],
      activePrayerCount: 5,
      challenges: [
        "Potential calling shift from corporate to ministry sector",
        "Conflicting spiritual counsel from pastor and spouse"
      ]
    }
  },
  {
    name: "betrayal-by-partner",
    scenario: "Business owner who discovered a co-founder was misrepresenting financials to investors",
    input: {
      latestMood: "frustrated",
      topAreas: ["business", "relationships", "leadership"],
      topTopics: ["forgiveness", "wisdom", "breakthrough"],
      recentSummaries: [
        "Found out David has been showing investors a different revenue model than what we agreed on. I confronted him. He minimized it. I don't know if I can trust anyone in this business right now.",
        "Legal meeting tomorrow. I feel betrayed and angry and I'm trying not to let this break my faith in people."
      ],
      activePrayerCount: 2,
      challenges: [
        "Co-founder misrepresented financials to investors without consent",
        "Legal action likely — navigating betrayal by a trusted partner"
      ]
    }
  },
  {
    name: "grief-while-leading",
    scenario: "Leader who lost a parent recently and is masking grief to maintain team stability",
    input: {
      latestMood: "grieving",
      topAreas: ["emotions", "family", "leadership"],
      topTopics: ["healing", "trust", "surrender"],
      recentSummaries: [
        "Mom passed on Tuesday. I was on a client call Wednesday morning. I don't know if that's strength or avoidance.",
        "People keep saying I'm handling it well. I don't feel like I'm handling it at all. I just keep moving because stopping feels like breaking."
      ],
      activePrayerCount: 3,
      challenges: [
        "Grieving the death of a parent while maintaining executive presence",
        "Suppressing grief to appear stable — no space to process loss"
      ]
    }
  }
];
