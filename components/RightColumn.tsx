import React, { useEffect, useState } from 'react';
import { SponsoredAd, GeoLocation } from '../types';
import { generateAdSketch, getCommunityAnnouncements } from '../services/geminiService';

const SPONSORED_CONTENT = [
  { id: 's1', title: 'The Coffee House', description: 'A steaming cup of artisan coffee on a saucer next to a book.' },
  { id: 's2', title: 'Annual Jazz Festival', description: 'A saxophone and a double bass leaning against a brick wall.' },
  { id: 's3', title: 'Main Street Florist', description: 'A rustic bouquet of wildflowers wrapped in brown paper.' },
];

interface RightColumnProps {
  location: GeoLocation;
}

export const RightColumn: React.FC<RightColumnProps> = ({ location }) => {
  const [ads, setAds] = useState<SponsoredAd[]>([]);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  
  useEffect(() => {
    // Load announcements for the specific location
    const fetchAnnouncements = async () => {
        const news = await getCommunityAnnouncements(location.county, location.state);
        setAnnouncements(news);
    };

    // Load initial placeholders then fetch images one by one
    const initialAds = SPONSORED_CONTENT.map(c => ({ ...c, imageUrl: undefined }));
    setAds(initialAds);

    const fetchImages = async () => {
      const newAds = [...initialAds];
      
      for (let i = 0; i < newAds.length; i++) {
        const url = await generateAdSketch(newAds[i].description);
        if (url) {
            newAds[i] = { ...newAds[i], imageUrl: url };
            // Update state incrementally so user sees progress
            setAds([...newAds]); 
        }
      }
    };

    fetchAnnouncements();
    fetchImages();
  }, [location]); // Re-run if location changes

  return (
    <div className="h-full flex flex-col bg-[#FDFBF7] p-6 overflow-y-auto border-l border-black/5">
      
      {/* Community Announcements Section */}
      <div className="mb-10">
        <div className="mb-6 text-center border-b-2 border-black/10 pb-2">
            <h3 className="text-2xl font-bold uppercase tracking-widest text-[#006464]">Community Board</h3>
        </div>
        <ul className="space-y-5">
            {announcements.length === 0 ? (
                [1,2,3,4,5].map(i => (
                    <li key={i} className="h-6 bg-gray-200 animate-pulse rounded w-full"></li>
                ))
            ) : (
                announcements.slice(0, 5).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                        <span className="text-[#006464] font-bold mt-1.5 text-lg">●</span>
                        <p className="text-xl font-medium leading-snug">{item}</p>
                    </li>
                ))
            )}
        </ul>
      </div>

      {/* Separator */}
      <div className="w-full border-t-2 border-dashed border-black/20 mb-8"></div>

      {/* Sponsored Section */}
      <div className="mb-6 text-center border-b border-black pb-4">
        <h3 className="text-2xl font-bold">Sponsored</h3>
      </div>

      <div className="space-y-4">
        {ads.map((ad) => (
          <div key={ad.id} className="group cursor-pointer">
            <div className="border-2 border-black p-2 bg-white shadow-sm transition-transform duration-300 group-hover:-translate-y-1 flex flex-col">
              <div className="h-28 w-full bg-gray-100 mb-2 overflow-hidden relative border border-gray-200">
                {ad.imageUrl ? (
                  <img 
                    src={ad.imageUrl} 
                    alt={ad.title}
                    className="w-full h-full object-cover sepia-[.3] contrast-110 group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 animate-pulse">
                        <span className="text-xs">Sketching...</span>
                    </div>
                )}
                {/* "Sponsor" tag looking like a stamp */}
                <div className="absolute top-1 right-1 border border-black px-1 py-0 text-[10px] font-bold rotate-0 bg-[#FDFBF7]">
                    SPONSOR
                </div>
              </div>
              
              <div className="text-center px-1">
                <h4 className="text-lg font-bold mb-0 group-hover:text-[#006464] transition-colors leading-tight">{ad.title}</h4>
                <p className="text-xs text-gray-600 line-clamp-1 mt-1">{ad.description}</p>
              </div>
            </div>
          </div>
        ))}
        
        <div className="border-2 border-dashed border-[#006464] p-4 text-center bg-[#006464]/5 m-2">
            <p className="text-[#006464] font-bold text-sm mb-1">Your Business Here</p>
            <button className="text-xs bg-[#006464] text-white px-3 py-1 rounded-sm hover:bg-[#004d4d] transition-colors">
                Contact Sales
            </button>
        </div>
      </div>
    </div>
  );
};