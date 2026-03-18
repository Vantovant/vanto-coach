# Vanto Coach - Technical Handover Report

**Project:** Vanto Coach - Executive Christian Life Coach
**Version:** 34
**Date:** March 18, 2026
**Platform:** Same.new (Next.js Cloud IDE)

---

## 1. Executive Summary

Vanto Coach is a premium AI-powered executive Christian life coaching application. It combines voice journaling, AI transcript processing, biblical guidance, cross-reference scripture study, and action item extraction into a unified coaching experience designed for busy Christian executives.

### Core Value Proposition
- Voice diary with live transcription
- AI-powered insight extraction (mood, topics, action items, prayer points)
- Bible API integration with cross-reference exploration
- Premium, calm executive design aesthetic

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.3.7 | React framework with App Router |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |
| shadcn/ui | Latest | Component library |
| Lucide React | Latest | Icon system |

### Backend/API
| Technology | Purpose |
|------------|---------|
| Next.js API Routes | Server-side endpoints |
| bible-api.com | Free Bible verse lookup (KJV) |
| OpenAI API | Optional AI transcript processing |

### Build Tools
| Tool | Purpose |
|------|---------|
| Bun | Package manager & runtime |
| Turbopack | Fast dev server bundler |
| Biome | Linting & formatting |

---

## 3. Project Structure

```
vanto-coach/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   ├── ai/
│   │   │   │   └── process-transcript/
│   │   │   │       └── route.ts  # AI processing endpoint
│   │   │   └── bible/
│   │   │       └── verse/
│   │   │           └── route.ts  # Bible verse lookup
│   │   ├── coach/
│   │   │   └── page.tsx          # Main coach page (tab router)
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home redirect
│   │   ├── globals.css           # Global styles + CSS variables
│   │   └── ClientBody.tsx        # Client-side body wrapper
│   │
│   ├── components/
│   │   ├── bible/                # Scripture components
│   │   │   ├── ScriptureCard.tsx # Verse display with cross-refs
│   │   │   ├── RelatedVersesStudy.tsx # Full study view
│   │   │   └── RelatedVersesView.tsx  # Dialog/compact view
│   │   ├── diary/                # Voice diary components
│   │   │   ├── VoiceRecorder.tsx # Recording interface
│   │   │   └── SessionDetail.tsx # Session view with playback
│   │   ├── layout/
│   │   │   └── CoachLayout.tsx   # Navigation & shell
│   │   ├── tabs/                 # Main tab views
│   │   │   ├── TodayTab.tsx      # Daily dashboard
│   │   │   ├── DiaryTab.tsx      # Voice diary list
│   │   │   ├── MemoryTab.tsx     # Pattern recognition
│   │   │   ├── ActionPlansTab.tsx# Task management
│   │   │   ├── ScriptureTab.tsx  # Bible reader
│   │   │   ├── InsightsTab.tsx   # Analytics
│   │   │   └── SettingsTab.tsx   # User preferences
│   │   └── ui/                   # shadcn components (40+ files)
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAudioRecorder.ts   # Microphone recording
│   │   ├── useSpeechRecognition.ts # Live transcription
│   │   ├── useTranscriptProcessor.ts # AI processing
│   │   ├── useBibleVerse.ts      # Verse fetching
│   │   └── useCrossReferences.ts # Cross-ref lookup
│   │
│   ├── lib/                      # Utilities & services
│   │   ├── ai/
│   │   │   └── config.ts         # AI prompts & settings
│   │   ├── bible/
│   │   │   ├── api.ts            # Bible API client
│   │   │   ├── cross-references.ts # Cross-ref database
│   │   │   └── navigation.ts     # URL builders
│   │   └── utils.ts              # Tailwind cn() helper
│   │
│   ├── data/
│   │   └── mock-data.ts          # Sample data for UI
│   │
│   └── types/
│       └── coach.ts              # TypeScript interfaces
│
├── public/                       # Static assets
├── .same/                        # Project documentation
│   ├── todos.md                  # Task tracking
│   └── TECHNICAL_HANDOVER.md     # This document
├── package.json
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── components.json               # shadcn config
└── .env.example                  # Environment template
```

---

## 4. Core Features

### 4.1 Voice Recording & Transcription

**Location:** `src/hooks/useAudioRecorder.ts`, `src/hooks/useSpeechRecognition.ts`

**Capabilities:**
- Real-time microphone recording via MediaRecorder API
- Live speech-to-text using Web Speech API
- Pause/resume functionality
- Audio playback before saving
- Permission handling with graceful fallbacks

**Browser Support:**
- Chrome/Edge: Full support (speech recognition)
- Firefox/Safari: Recording only (no live transcription)

### 4.2 AI Transcript Processing

**Location:** `src/app/api/ai/process-transcript/route.ts`, `src/hooks/useTranscriptProcessor.ts`

**Processing Pipeline:**
1. Clean transcript (remove filler words, fix grammar)
2. Generate summary (1-3 sentences)
3. Detect mood (grateful, anxious, hopeful, etc.)
4. Extract key topics/life areas
5. Identify action items
6. Extract prayer points
7. Find scripture references
8. Generate coaching insight (OpenAI only)

**Fallback:** Local keyword-based processing when OpenAI unavailable

### 4.3 Bible Integration

**Location:** `src/lib/bible/`

**Components:**
- `api.ts` - Bible API client (bible-api.com)
- `cross-references.ts` - Curated verse relationships (25+ entries)
- `navigation.ts` - URL builders for scripture navigation

**Features:**
- Verse lookup by reference (John 3:16, Proverbs 3:5-6)
- Multiple verse batch loading
- Cross-reference suggestions
- Related verses study view
- Click-to-navigate between verses

### 4.4 Cross-References System

**Location:** `src/lib/bible/cross-references.ts`, `src/hooks/useCrossReferences.ts`

**Data Structure:**
```typescript
interface CrossReference {
  reference: string;      // "Romans 8:28"
  theme: string;          // "God's plan"
  relevance: 'direct' | 'thematic' | 'complementary';
}

interface CrossReferenceEntry {
  themes: string[];       // ["trust", "faith", "guidance"]
  related: CrossReference[];
}
```

**Currently Indexed Verses:**
- Proverbs 3:5-6, Jeremiah 29:11, Philippians 4:6-7, 13
- Isaiah 40:31, 41:10, 26:3, Joshua 1:9
- John 3:16, Romans 8:28, James 1:5
- Colossians 3:23-24, 1 Timothy 4:12, Matthew 5:16
- And more (see cross-references.ts for full list)

---

## 5. State Management

### Local Component State
- React `useState` for UI state
- React `useEffect` for side effects
- `useMemo` for computed values

### URL-Based State
- Tab navigation: `?tab=scripture`
- Verse navigation: `?book=Proverbs&chapter=3&verse=5`
- Study view: `?study=Proverbs%203:5`

### No Global State Library
Currently using prop drilling and URL params. For scale, consider:
- Zustand for lightweight global state
- React Context for user settings

---

## 6. API Routes

### POST `/api/ai/process-transcript`

**Request:**
```typescript
{
  transcript: string;
  options?: {
    generateSummary?: boolean;
    extractActions?: boolean;
    extractPrayers?: boolean;
    detectMood?: boolean;
    cleanTranscript?: boolean;
  };
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    rawTranscript: string;
    cleanedTranscript: string;
    summary: string;
    mood: string | null;
    moodConfidence: number;
    keyTopics: string[];
    actionItems: string[];
    prayerPoints: string[];
    scriptureReferences: string[];
    spiritualThemes: string[];
    coachingInsight?: string;
  };
  fallbackUsed?: boolean;
  error?: string;
}
```

### GET `/api/bible/verse`

**Query Params:** `?ref=John+3:16&translation=kjv`

**Response:**
```typescript
{
  success: boolean;
  passage?: {
    reference: string;
    verses: BibleVerse[];
    text: string;
    translation: string;
  };
  error?: string;
}
```

### POST `/api/bible/verse` (Batch)

**Request:**
```typescript
{
  references: string[];
  translation?: string;
}
```

---

## 7. Design System

### Color Palette (CSS Variables)

```css
/* Light Theme */
--background: 45 30% 97%;      /* Warm off-white */
--foreground: 30 15% 15%;      /* Dark warm gray */
--primary: 152 35% 35%;        /* Muted forest green */
--accent: 152 30% 40%;         /* Accent green */
--scripture: 45 40% 92%;       /* Scripture highlight */
--spiritual: 280 25% 55%;      /* Spiritual/prayer purple */
--success: 152 50% 35%;        /* Success green */
--warning: 38 92% 50%;         /* Warning amber */
--destructive: 0 70% 50%;      /* Error red */
```

### Typography

```css
/* Fonts */
--font-sans: 'Inter', system-ui;      /* UI text */
--font-serif: 'Crimson Pro', Georgia;  /* Scripture, headings */
```

### Component Classes

```css
.card-premium   /* Elevated card with subtle shadow */
.card-elevated  /* Standard elevated card */
.animate-fade-in /* Entry animation */
```

---

## 8. Type Definitions

### Core Types (src/types/coach.ts)

```typescript
// Session Types
interface CoachSession {
  id: string;
  title: string;
  session_date: string;
  audio_url: string | null;
  raw_transcript: string | null;
  cleaned_transcript: string | null;
  summary: string | null;
  mood: SessionMood | null;
  life_areas: LifeArea[];
  spiritual_topics: SpiritualTopic[];
  coach_response: string | null;
  biblical_response: BiblicalResponse | null;
  structured_entry: StructuredEntry | null;
  // ... timestamps
}

type SessionMood =
  | 'grateful' | 'hopeful' | 'peaceful' | 'joyful'
  | 'reflective' | 'anxious' | 'stressed' | 'overwhelmed'
  | 'determined' | 'convicted' | 'neutral';

type LifeArea =
  | 'faith' | 'family' | 'health' | 'finances'
  | 'business' | 'leadership' | 'relationships' | 'growth';

// Bible Types
interface BiblePassage {
  reference: string;
  verses: BibleVerse[];
  text: string;
  translation: string;
}

interface CrossReference {
  reference: string;
  theme: string;
  relevance: 'direct' | 'thematic' | 'complementary';
}
```

---

## 9. Environment Variables

```env
# .env.local

# Optional: OpenAI API for enhanced processing
OPENAI_API_KEY=sk-your-api-key-here

# Without this key, app uses local fallback processing
```

---

## 10. Key Dependencies

```json
{
  "dependencies": {
    "next": "15.3.7",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@radix-ui/react-*": "various",  // UI primitives
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.0",
    "lucide-react": "^0.511.0",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "tailwindcss": "^4.1.4",
    "@tailwindcss/postcss": "^4.1.4",
    "@biomejs/biome": "^1.9.4"
  }
}
```

---

## 11. Features Status

### Implemented ✅
- [x] Voice recording with real microphone
- [x] Live speech-to-text transcription
- [x] AI transcript processing (OpenAI + fallback)
- [x] Bible verse lookup (bible-api.com)
- [x] Cross-reference database & display
- [x] Click-to-navigate for scripture
- [x] Related Verses Study page
- [x] Session detail with audio playback
- [x] Premium responsive UI
- [x] All 7 tab views implemented

### Ready for Backend Integration 🔄
- [ ] User authentication
- [ ] Session persistence (database)
- [ ] Cloud audio storage
- [ ] Real-time AI coaching responses
- [ ] VantoOS Plan sync

### Future Enhancements 📋
- [ ] Personal verse notes
- [ ] Bible reading plans
- [ ] Verse memorization mode
- [ ] Search by keyword/theme
- [ ] Multi-translation comparison
- [ ] Dark mode toggle
- [ ] Offline support (PWA)

---

## 12. Development Commands

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Lint code
bun run lint

# Type check
bun run type-check
```

---

## 13. Deployment

### Netlify (Recommended)
- Dynamic deployment (Next.js server features)
- Build command: `bun run build`
- Publish directory: `.next`

### Static Export
Not recommended due to API routes. If needed:
```js
// next.config.js
module.exports = {
  output: 'export',
  distDir: 'out'
}
```

---

## 14. Known Limitations

1. **Speech Recognition**: Only works in Chrome/Edge (Web Speech API)
2. **Cross-References**: Limited to ~25 verses currently
3. **Bible API**: Only KJV translation fully supported
4. **No Persistence**: Sessions stored in component state only
5. **No Auth**: No user accounts or data isolation

---

## 15. Security Considerations

1. **API Keys**: OpenAI key stored in environment, not exposed to client
2. **Audio Data**: Processed client-side, not uploaded without consent
3. **No PII Storage**: Currently no database, no user data stored
4. **Bible API**: Public API, no authentication needed

---

## 16. Performance Notes

1. **Code Splitting**: Each tab lazy-loads via dynamic imports
2. **Image Optimization**: Using Next.js Image component
3. **Font Loading**: Google Fonts with display=swap
4. **Verse Caching**: Bible verses cached in React Query/hooks

---

## 17. Testing Recommendations

For production readiness:
1. Unit tests for hooks (Jest + React Testing Library)
2. E2E tests for recording flow (Playwright)
3. API route tests (Supertest)
4. Accessibility audit (axe-core)

---

## 18. Contact & Support

- **Platform**: Same.new
- **Support**: support@same.new
- **Documentation**: https://docs.same.new

---

*End of Technical Handover Report*
