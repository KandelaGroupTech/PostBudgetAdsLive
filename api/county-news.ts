import type { VercelRequest, VercelResponse } from '@vercel/node';
import Parser from 'rss-parser';
import { COUNTY_RSS_FEEDS, getGoogleNewsRssUrl } from '../utils/countyRssFeeds';

const parser = new Parser();

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { county, state } = req.body;
    if (!county || !state) {
      return res.status(400).json({ error: 'Missing county or state' });
    }

    const key = `${county}|${state}`;
    let rssUrl = COUNTY_RSS_FEEDS[key];
    let source = 'official';

    if (!rssUrl) {
      rssUrl = getGoogleNewsRssUrl(county, state);
      source = 'google-news';
    }

    // Google News RSS has a specific format, standard county ones vary.
    // rss-parser normalizes them.
    const feed = await parser.parseURL(rssUrl);
    
    // Extract top 5 items
    const items = feed.items.slice(0, 5).map(item => ({
      title: item.title || 'Community Update',
      link: item.link || '#',
      pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '',
    }));

    return res.status(200).json({ items, source });
  } catch (error: any) {
    console.error('Error fetching RSS feed:', error);
    return res.status(500).json({ error: 'Failed to fetch community announcements' });
  }
}
