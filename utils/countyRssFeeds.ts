export const COUNTY_RSS_FEEDS: Record<string, string> = {
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

export const getGoogleNewsRssUrl = (county: string, state: string) => {
  const query = encodeURIComponent(`${county} County ${state} government events news`);
  return `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
};
