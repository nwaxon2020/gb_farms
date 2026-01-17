import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY; 
  const query = encodeURIComponent('Nigeria AND (agriculture OR "food prices" OR livestock)');
  
  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=4&apiKey=${apiKey}`,
      { next: { revalidate: 3600 } } // Cache news for 1 hour to stay under free limits
    );

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}