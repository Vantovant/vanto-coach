/**
 * Today Semantic Evaluation Harness
 *
 * Runs 10 golden fixtures through the exact Today prompt logic from
 * src/app/api/ai/today-coaching/route.ts and scores each output
 * against a 5-category rubric using a lightweight LLM judge.
 *
 * Run with: npx tsx src/lib/ai/eval/today-harness.ts
 * Requires: OPENAI_API_KEY set in environment or .env.local
 */

import { GOLDEN_FIXTURES, type TodayFixtureInput } from './golden-fixtures';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── Load .env.local manually (tsx doesn't auto-load Next.js env) ────────────
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}
loadEnv();

// ─── Types ────────────────────────────────────────────────────────────────────

interface RubricScore {
  biblical_grounding: number;      // 1–5
  executive_relevance: number;     // 1–5
  action_clarity: number;          // 1–5
  absence_of_generic_filler: number; // 1–5
  tone_safety: number;             // 1–5
}

interface HardGateFlags {
  is_generic: boolean;
  shallow_verse_dump: boolean;
  ignores_executive_context: boolean;
  invented_facts: boolean;
  unsafe_certainty: boolean;
}

interface FixtureResult {
  fixture_name: string;
  scenario: string;
  generated_output: string;
  rubric: RubricScore;
  overall_score: number;
  hard_gate: HardGateFlags;
  verdict: 'PASS' | 'FAIL';
  failure_reasons: string[];
}

// ─── Exact Today prompt logic (replicated from today-coaching/route.ts) ───────

function buildTodayPrompts(input: TodayFixtureInput): { system: string; user: string } {
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
- Most recent mood: ${input.latestMood ?? 'not recorded'}
- Most active life areas recently: ${input.topAreas.length > 0 ? input.topAreas.join(', ') : 'none'}
- Recurring spiritual themes: ${input.topTopics.length > 0 ? input.topTopics.join(', ') : 'none identified'}
- Recent session summaries: ${input.recentSummaries.length > 0 ? input.recentSummaries.slice(0, 2).join(' / ') : 'none'}
- Active prayer requests: ${input.activePrayerCount}
- Recorded challenges: ${input.challenges.length > 0 ? input.challenges.slice(0, 2).join('; ') : 'none'}

Write 1–2 sentences for this client's day using this exact structure:
- one spiritually grounded insight tied to the situation
- one concrete executive action or leadership posture for today

The insight must express a clearly biblical truth, not just generic spiritual comfort. In grief, loss, or suffering scenarios, use biblical language about God's presence, comfort, lament, wisdom, or faithful endurance without dumping verses. In betrayal, deception, misrepresentation, or trust-breach scenarios, name the breach directly and frame the action around truthful review, sober stewardship, integrity, or wise response before emotional reaction. If business, team, leadership, financial, relational, or decision responsibility is present, name it directly in the action. If the situation is uncertain or discernment-based, use humble language and do not imply certainty. Avoid generic encouragement, vague filler, shallow verse dumping, invented facts, and unsafe certainty.`;

  return { system: systemPrompt, user: userPrompt };
}

// ─── OpenAI call helper ───────────────────────────────────────────────────────

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set. Add it to .env.local or export it before running.');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} — ${err}`);
  }

  const json = await res.json() as { choices: { message: { content: string } }[] };
  return json.choices?.[0]?.message?.content?.trim() ?? '';
}

// ─── Generate Today output for a fixture ─────────────────────────────────────

async function generateTodayOutput(input: TodayFixtureInput): Promise<string> {
  const { system, user } = buildTodayPrompts(input);
  return callOpenAI(system, user, 0.65, 120);
}

// ─── LLM Judge: score the output against the rubric ──────────────────────────

async function judgeOutput(
  fixture: typeof GOLDEN_FIXTURES[number],
  generatedOutput: string
): Promise<{ rubric: RubricScore; hardGate: HardGateFlags }> {
  const judgeSystem = `You are a rigorous evaluator of AI coaching output quality.
You will receive a coaching sentence generated for a specific client situation.
You must score it honestly and return ONLY valid JSON — no markdown, no explanation outside the JSON.`;

  const judgeUser = `CLIENT SITUATION:
Name: ${fixture.name}
Scenario: ${fixture.scenario}
Mood: ${fixture.input.latestMood}
Life areas: ${fixture.input.topAreas.join(', ')}
Spiritual themes: ${fixture.input.topTopics.join(', ')}
Session summaries: ${fixture.input.recentSummaries.join(' / ')}
Active prayers: ${fixture.input.activePrayerCount}
Challenges: ${fixture.input.challenges.join('; ')}

GENERATED COACHING OUTPUT:
"${generatedOutput}"

TASK:
Score this output honestly. Do not inflate scores. A score of 5 means genuinely excellent — specific, grounded, and earned. A score of 1–2 means it failed that criterion clearly.

Return this exact JSON structure (no other text):
{
  "biblical_grounding": <1-5 integer>,
  "executive_relevance": <1-5 integer>,
  "action_clarity": <1-5 integer>,
  "absence_of_generic_filler": <1-5 integer>,
  "tone_safety": <1-5 integer>,
  "is_generic": <true|false>,
  "shallow_verse_dump": <true|false>,
  "ignores_executive_context": <true|false>,
  "invented_facts": <true|false>,
  "unsafe_certainty": <true|false>,
  "notes": "<brief honest note about why scores were given>"
}

Scoring guidance:
- biblical_grounding: Does it reference or imply scripture/spiritual truth meaningfully (not just mention God generically)?
- executive_relevance: Does it specifically address the professional/leadership pressure in the scenario?
- action_clarity: Does it give a directional nudge or clear focus (not vague)?
- absence_of_generic_filler: Penalize phrases like "God has a plan", "trust the process", "you've got this" without specificity
- tone_safety: Is it emotionally appropriate for the severity? Does it avoid toxic positivity or false certainty?
- is_generic: True if the output could have been written without reading the client's actual context
- shallow_verse_dump: True if it just pastes a Bible reference without real application
- ignores_executive_context: True if there's no reference to the leadership/business pressure
- invented_facts: True if it asserts something not present in the input (e.g., names, specific outcomes)
- unsafe_certainty: True if it gives definitive promise ("God will definitely...") when the situation is genuinely ambiguous`;

  const raw = await callOpenAI(judgeSystem, judgeUser, 0.2, 400);

  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    throw new Error(`Judge returned non-JSON: ${raw}`);
  }

  const rubric: RubricScore = {
    biblical_grounding: Number(parsed.biblical_grounding) || 1,
    executive_relevance: Number(parsed.executive_relevance) || 1,
    action_clarity: Number(parsed.action_clarity) || 1,
    absence_of_generic_filler: Number(parsed.absence_of_generic_filler) || 1,
    tone_safety: Number(parsed.tone_safety) || 1,
  };

  const hardGate: HardGateFlags = {
    is_generic: Boolean(parsed.is_generic),
    shallow_verse_dump: Boolean(parsed.shallow_verse_dump),
    ignores_executive_context: Boolean(parsed.ignores_executive_context),
    invented_facts: Boolean(parsed.invented_facts),
    unsafe_certainty: Boolean(parsed.unsafe_certainty),
  };

  return { rubric, hardGate };
}

// ─── Evaluate a single fixture ────────────────────────────────────────────────

async function evaluateFixture(fixture: typeof GOLDEN_FIXTURES[number]): Promise<FixtureResult> {
  const generatedOutput = await generateTodayOutput(fixture.input);
  const { rubric, hardGate } = await judgeOutput(fixture, generatedOutput);

  const overallScore = Math.round(
    (rubric.biblical_grounding +
      rubric.executive_relevance +
      rubric.action_clarity +
      rubric.absence_of_generic_filler +
      rubric.tone_safety) / 5
  );

  // Hard gate: any flag triggers FAIL
  const failingGates = Object.entries(hardGate)
    .filter(([, v]) => v)
    .map(([k]) => k.replace(/_/g, ' '));

  // Rubric gate: any category score ≤ 2 triggers FAIL
  const lowScores = Object.entries(rubric)
    .filter(([, v]) => v <= 2)
    .map(([k, v]) => `${k.replace(/_/g, ' ')} scored ${v}/5`);

  const failure_reasons = [...failingGates.map(g => `Hard gate: ${g}`), ...lowScores];
  const verdict: 'PASS' | 'FAIL' = failure_reasons.length > 0 ? 'FAIL' : 'PASS';

  return {
    fixture_name: fixture.name,
    scenario: fixture.scenario,
    generated_output: generatedOutput,
    rubric,
    overall_score: overallScore,
    hard_gate: hardGate,
    verdict,
    failure_reasons,
  };
}

// ─── Print structured result ──────────────────────────────────────────────────

function printResult(result: FixtureResult, index: number) {
  const bar = '─'.repeat(70);
  const verdictTag = result.verdict === 'PASS'
    ? '[PASS ✓]'
    : '[FAIL ✗]';

  console.log(`\n${bar}`);
  console.log(`  ${index}. ${result.fixture_name.toUpperCase()}  ${verdictTag}`);
  console.log(`     Scenario: ${result.scenario}`);
  console.log(`${bar}`);
  console.log(`  Generated output:`);
  console.log(`    "${result.generated_output}"`);
  console.log('');
  console.log('  Rubric scores (1–5):');
  console.log(`    Biblical grounding       : ${result.rubric.biblical_grounding}/5`);
  console.log(`    Executive relevance      : ${result.rubric.executive_relevance}/5`);
  console.log(`    Action clarity           : ${result.rubric.action_clarity}/5`);
  console.log(`    Absence of generic filler: ${result.rubric.absence_of_generic_filler}/5`);
  console.log(`    Tone safety              : ${result.rubric.tone_safety}/5`);
  console.log(`    Overall avg score        : ${result.overall_score}/5`);
  console.log('');
  console.log('  Hard gate flags:');
  for (const [flag, value] of Object.entries(result.hard_gate)) {
    if (value) console.log(`    ⚠  ${flag.replace(/_/g, ' ')}`);
  }
  if (!Object.values(result.hard_gate).some(Boolean)) {
    console.log('    (none triggered)');
  }
  if (result.failure_reasons.length > 0) {
    console.log('');
    console.log('  Failure reasons:');
    for (const reason of result.failure_reasons) {
      console.log(`    • ${reason}`);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║         VANTO COACH — TODAY SEMANTIC EVALUATION HARNESS             ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log(`\nFixtures to evaluate: ${GOLDEN_FIXTURES.length}`);
  console.log('Running...\n');

  const results: FixtureResult[] = [];
  let evaluated = 0;

  for (const fixture of GOLDEN_FIXTURES) {
    evaluated++;
    process.stdout.write(`  [${evaluated}/${GOLDEN_FIXTURES.length}] ${fixture.name} ... `);
    try {
      const result = await evaluateFixture(fixture);
      results.push(result);
      console.log(result.verdict);
    } catch (err) {
      console.log('ERROR');
      console.error(`    ↳ ${String(err)}`);
      // Record a hard error result so we don't silently skip
      results.push({
        fixture_name: fixture.name,
        scenario: fixture.scenario,
        generated_output: '[ERROR — see above]',
        rubric: { biblical_grounding: 0, executive_relevance: 0, action_clarity: 0, absence_of_generic_filler: 0, tone_safety: 0 },
        overall_score: 0,
        hard_gate: { is_generic: false, shallow_verse_dump: false, ignores_executive_context: false, invented_facts: false, unsafe_certainty: false },
        verdict: 'FAIL',
        failure_reasons: [`Error during evaluation: ${String(err)}`],
      });
    }
  }

  // ─── Print detailed results ─────────────────────────────────────────────────
  console.log('\n\n══════════════════════════════════════════════════════════════════════');
  console.log('  DETAILED RESULTS');
  console.log('══════════════════════════════════════════════════════════════════════');

  for (let i = 0; i < results.length; i++) {
    printResult(results[i], i + 1);
  }

  // ─── Summary table ──────────────────────────────────────────────────────────
  const passed = results.filter(r => r.verdict === 'PASS').length;
  const failed = results.filter(r => r.verdict === 'FAIL').length;

  console.log('\n\n══════════════════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Fixtures evaluated : ${results.length} / ${GOLDEN_FIXTURES.length}`);
  console.log(`  PASS               : ${passed}`);
  console.log(`  FAIL               : ${failed}`);
  console.log('');

  const avgBiblical = (results.reduce((s, r) => s + r.rubric.biblical_grounding, 0) / results.length).toFixed(2);
  const avgExec = (results.reduce((s, r) => s + r.rubric.executive_relevance, 0) / results.length).toFixed(2);
  const avgAction = (results.reduce((s, r) => s + r.rubric.action_clarity, 0) / results.length).toFixed(2);
  const avgFiller = (results.reduce((s, r) => s + r.rubric.absence_of_generic_filler, 0) / results.length).toFixed(2);
  const avgTone = (results.reduce((s, r) => s + r.rubric.tone_safety, 0) / results.length).toFixed(2);

  console.log('  Avg rubric scores across all fixtures:');
  console.log(`    Biblical grounding       : ${avgBiblical}/5`);
  console.log(`    Executive relevance      : ${avgExec}/5`);
  console.log(`    Action clarity           : ${avgAction}/5`);
  console.log(`    Absence of generic filler: ${avgFiller}/5`);
  console.log(`    Tone safety              : ${avgTone}/5`);

  console.log('');
  console.log('  Per-fixture verdict:');
  for (const r of results) {
    const tag = r.verdict === 'PASS' ? 'PASS ✓' : 'FAIL ✗';
    console.log(`    ${r.fixture_name.padEnd(40)} ${tag}`);
  }

  console.log('');

  // Exit non-zero if all passed with no failures — that would be a rubber stamp
  // (honesty gate: if no fixture failed, warn but don't error — the gate did evaluate honestly)
  if (failed === 0) {
    console.log('  ⚠  NOTE: All fixtures passed. Review detailed results to confirm the gate');
    console.log('     is evaluating honestly and not rubber-stamping.');
  }

  if (results.length < GOLDEN_FIXTURES.length) {
    console.error(`\n  ✗ HARNESS INCOMPLETE: Only ${results.length}/${GOLDEN_FIXTURES.length} fixtures evaluated.`);
    process.exit(1);
  }

  console.log('\n══════════════════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\nFatal harness error:', err);
  process.exit(1);
});
