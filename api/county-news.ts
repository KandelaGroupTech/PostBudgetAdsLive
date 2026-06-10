import type { VercelRequest, VercelResponse } from '@vercel/node';

const COUNTY_RSS_FEEDS: Record<string, string> = {
  "Montgomery|Maryland": "https://www.montgomerycountymd.gov/CommonControls/SyndicationFeed/RSSFeed.aspx?FeedID=24",
  "Los Angeles|California": "https://lacounty.gov/feed/",
  "Cook|Illinois": "https://www.cookcountyil.gov/rss.xml",
  "Harris|Texas": "https://www.harriscountytx.gov/rss.aspx",
  "Maricopa|Arizona": "https://www.maricopa.gov/RSSFeed.aspx?ModID=74&CID=All-0",
  "San Diego|California": "https://www.countynewscenter.com/feed/",
  "Orange|California": "https://www.ocgov.com/rss.xml",
  "Miami-Dade|Florida": "https://www8.miamidade.gov/global/rss.page",
  "Dallas|Texas": "https://www.dallascounty.org/rss.php"
};

const getGoogleNewsRssUrl = (county: string, state: string) => {
  const query = encodeURIComponent(`${county} County ${state} government events news`);
  return `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
};

// Simple Regex to extract items
const parseRSS = (xml: string) => {
    const items: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
        const itemXml = match[1];
        const titleMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || itemXml.match(/<title>([\s\S]*?)<\/title>/i);
        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
        const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

        let title = titleMatch ? titleMatch[1].trim() : 'Community Update';
        title = title.replace(/<[^>]*>?/gm, '');

        let link = linkMatch ? linkMatch[1].trim() : '#';
        const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : '';
        let pubDate = '';
        if (pubDateStr) {
            try {
                pubDate = new Date(pubDateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            } catch (e) {
                pubDate = pubDateStr;
            }
        }

        items.push({ title, link, pubDate });
        if (items.length >= 5) break;
    }
    return items;
};

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

    const response = await fetch(rssUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    
    const items = parseRSS(xml);

    return res.status(200).json({ items, source });
  } catch (error: any) {
    console.error('Error fetching RSS feed:', error);
    return res.status(500).json({ error: 'Failed to fetch community announcements' });
  }
}
