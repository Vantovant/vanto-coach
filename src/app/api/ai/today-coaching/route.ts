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

  const systemPrompt = `You are an executive Christian life coach writing a brief daily coaching focus for a client.

Rules:
- Exactly 1–2 sentences total
- The response must contain two parts: one spiritually grounded insight tied to the actual situation, and one concrete executive action or leadership posture for today
- The spiritually grounded insight must express a clearly biblical truth, not just generic spiritual comfort
- Must reference the client's actual data — never generic
- If business, team, leadership, financial, relational, decision, or performance responsibility is present, name that responsibility directly in the action
- If the situation is ambiguous, uncertain, or discernment-based, avoid certainty language and use humble phrasing such as "consider," "hold this before God," "test this carefully," or "do not rush the decision"
- In grief, loss, or suffering scenarios, anchor the insight in biblical language about God's presence, comfort, lament, wisdom, or faithful endurance without dumping verses
- In betrayal, deception, misrepresentation, or trust-breach scenarios, name the breach directly and frame the action around truthful review, sober stewardship, integrity, or wise response before emotional reaction
- Sound like executive counsel, not generic encouragement
- Avoid vague filler like "trust the process," "seek healing," "rise above," or "God will make a way" unless clearly tied to the supplied context
- Do not do shallow verse dumping or tack on unexplained Bible references
- Do not invent specifics, outcomes, names, or promises not present in the input
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

Write 1–2 sentences for this client's day using this exact structure:
- one spiritually grounded insight tied to the situation
- one concrete executive action or leadership posture for today

The insight must express a clearly biblical truth, not just generic spiritual comfort. In grief, loss, or suffering scenarios, use biblical language about God's presence, comfort, lament, wisdom, or faithful endurance without dumping verses. In betrayal, deception, misrepresentation, or trust-breach scenarios, name the breach directly and frame the action around truthful review, sober stewardship, integrity, or wise response before emotional reaction. If business, team, leadership, financial, relational, or decision responsibility is present, name it directly in the action. If the situation is uncertain or discernment-based, use humble language and do not imply certainty. Avoid generic encouragement, vague filler, shallow verse dumping, invented facts, and unsafe certainty.`;

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
