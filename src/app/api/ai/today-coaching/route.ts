import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'OPENAI_API_KEY not configured', missing_env: 'OPENAI_API_KEY' },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { latestMood, topAreas, topTopics, recentSummaries, activePrayerCount, challenges } = body;

  const systemPrompt = `You are an executive Christian life coach writing a single daily spiritual focus sentence for a client.

Rules:
- Exactly 1–2 sentences
- Must reference the client's actual data — never generic
- Spiritually grounded but not preachy
- Warm, direct, coaching tone
- Do not start with "You" — vary the opening
- Return ONLY the sentence(s) as plain text, no JSON, no quotes`;

  const userPrompt = `Client context for today:
- Most recent mood: ${latestMood ?? 'not recorded'}
- Most active life areas recently: ${topAreas.length > 0 ? topAreas.join(', ') : 'none'}
- Recurring spiritual themes: ${topTopics.length > 0 ? topTopics.join(', ') : 'none identified'}
- Recent session summaries: ${recentSummaries.length > 0 ? recentSummaries.slice(0, 2).join(' / ') : 'none'}
- Active prayer requests: ${activePrayerCount}
- Recorded challenges: ${challenges.length > 0 ? challenges.slice(0, 2).join('; ') : 'none'}

Write one spiritual focus sentence for this client's day.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.65,
        max_tokens: 120,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ success: false, error: err }, { status: 500 });
    }

    const json = await response.json();
    const sentence = json.choices?.[0]?.message?.content?.trim() ?? '';

    if (!sentence) {
      return NextResponse.json({ success: false, error: 'Empty response' }, { status: 500 });
    }

    return NextResponse.json({ success: true, sentence });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
