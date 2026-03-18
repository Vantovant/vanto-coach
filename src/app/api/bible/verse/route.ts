import { NextRequest, NextResponse } from 'next/server';
import { fetchBiblePassage, fetchMultiplePassages, type BibleLookupResult } from '@/lib/bible/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reference = searchParams.get('ref');
  const translation = searchParams.get('translation') || 'kjv';

  if (!reference) {
    return NextResponse.json(
      { success: false, error: 'Reference parameter required' },
      { status: 400 }
    );
  }

  const result = await fetchBiblePassage(reference, translation);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { references, translation = 'kjv' } = body;

    if (!references || !Array.isArray(references) || references.length === 0) {
      return NextResponse.json(
        { success: false, error: 'References array required' },
        { status: 400 }
      );
    }

    // Limit to 10 references per request
    const limitedRefs = references.slice(0, 10);
    const results = await fetchMultiplePassages(limitedRefs, translation);

    // Convert Map to object for JSON response
    const resultsObject: Record<string, BibleLookupResult> = {};
    results.forEach((value, key) => {
      resultsObject[key] = value;
    });

    return NextResponse.json({
      success: true,
      results: resultsObject,
    });
  } catch (error) {
    console.error('Bible API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch passages' },
      { status: 500 }
    );
  }
}
