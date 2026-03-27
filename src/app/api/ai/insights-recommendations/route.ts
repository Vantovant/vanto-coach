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
  const { period, dominantMood, topAreas, challenges, summaries, prayerThemes, sessionCount } = body;

  const systemPrompt = `You are an executive Christian life coach. Generate exactly 3 specific, grounded coaching recommendations for a client based on their real diary data.

Rules:
- Each recommendation must be directly tied to the data provided (mood, challenges, life areas, prayers)
- Do not use generic advice like "keep journaling" or "pray more"
- Each recommendation must be actionable and specific to this person's actual situation
- Tone: warm, pastoral, executive coaching — not preachy
- Format: return a JSON array of exactly 3 strings, each 1–2 sentences
- Return ONLY valid JSON: ["rec1", "rec2", "rec3"]`;

  const userPrompt = `Client data for their ${period} review:
- Sessions recorded: ${sessionCount}
- Dominant mood this period: ${dominantMood}
- Most active life areas: ${topAreas.length > 0 ? topAreas.join(', ') : 'none identified'}
- Recorded challenges/struggles: ${challenges.length > 0 ? challenges.slice(0, 3).join('; ') : 'none recorded'}
- Recent session summaries: ${summaries.length > 0 ? summaries.slice(0, 3).map((s: string, i: number) => `(${i + 1}) ${s}`).join(' ') : 'none available'}
- Active prayer themes: ${prayerThemes.length > 0 ? prayerThemes.join(', ') : 'none'}

Generate 3 specific coaching recommendations grounded in this data.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.5,
        max_tokens: 400,
        response_format: { type: 'json_object' },
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
    const raw = json.choices?.[0]?.message?.content ?? '{}';

    let recommendations: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      // Accept {"recommendations": [...]} or a bare array wrapped as an object key
      if (Array.isArray(parsed)) {
        recommendations = parsed.slice(0, 3);
      } else {
        const key = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
        if (key) recommendations = (parsed[key] as string[]).slice(0, 3);
      }
    } catch {
      // fall through to fallback
    }

    if (recommendations.length === 0) {
      return NextResponse.json({ success: false, error: 'Could not parse recommendations' }, { status: 500 });
    }

    return NextResponse.json({ success: true, recommendations });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
