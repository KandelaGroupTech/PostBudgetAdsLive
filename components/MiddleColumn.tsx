import React, { useEffect, useState, useRef } from 'react';
import { TextAd, GeoLocation } from '../types';
import { PostAdModal } from './PostAdModal';

const MOCK_ADS: TextAd[] = [
  { id: '1', category: 'FOR SALE', content: 'Vintage typewriter, mint condition. Needs new ribbon. $50 OBO.', contact: '555-012-3456', timestamp: 'Oct 24' },
  { id: '2', category: 'SERVICE', content: 'Piano tuning and repair. 30 years experience. Will travel within county.', contact: 'Joe @ 555-998-8765', timestamp: 'Oct 24' },
  { id: '3', category: 'WANTED', content: 'Looking for old barn wood for project. Will haul away for free.', contact: 'Sarah: 555-234-5678', timestamp: 'Oct 23' },
  { id: '4', category: 'COMMUNITY', content: 'Volunteer needed for library reading hour. Tuesdays 4pm.', contact: '123 Main St Library', timestamp: 'Oct 23' },
  { id: '5', category: 'FARM', content: 'Fresh eggs, free range. $4/dozen. Pick up at Miller Farm.', contact: '1024 Miller Farm Rd', timestamp: 'Oct 23' },
  { id: '6', category: 'LOST', content: 'Lost cat, orange tabby. Answers to "Cheddar". Reward.', contact: '555-777-1111', timestamp: 'Oct 22' },
  { id: '7', category: 'FOR SALE', content: '1998 Honda Civic. Runs great, ugly paint. $1500.', contact: 'Mike: 555-888-9999', timestamp: 'Oct 22' },
  { id: '8', category: 'HELP WANTED', content: 'General labor needed for fence painting. Cash daily.', contact: '555-432-1000', timestamp: 'Oct 21' },
  { id: '9', category: 'FREE', content: 'Box of mystery romance novels. Porch pickup.', contact: '56 Oak St, Downtown', timestamp: 'Oct 21' },
  { id: '10', category: 'EVENT', content: 'Saturday Farmers Market starts at 8am sharp. Come early for best produce.', contact: 'Town Square Pavilion', timestamp: 'Oct 20' },
];

interface MiddleColumnProps {
  location: GeoLocation;
}

export const MiddleColumn: React.FC<MiddleColumnProps> = ({ location }) => {
  const [visibleAds, setVisibleAds] = useState<TextAd[]>(MOCK_ADS.slice(0, 5));
  const [startIndex, setStartIndex] = useState(0);
  const [showPostAdModal, setShowPostAdModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Rotate ads effect
  useEffect(() => {
    const interval = setInterval(() => {
      setStartIndex((prev) => {
        const nextIndex = (prev + 1) % MOCK_ADS.length;
        const newSlice = [];
        for (let i = 0; i < 5; i++) {
          newSlice.push(MOCK_ADS[(nextIndex + i) % MOCK_ADS.length]);
        }
        setVisibleAds(newSlice);
        return nextIndex;
      });
    }, 30000); // Rotate every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#FDFBF7] border-r-2 border-black/10 relative">
      <div className="p-6 border-b-2 border-black/10 flex justify-between items-center bg-[#fbf9f4]">
        <h3 className="text-3xl font-bold tracking-tight">Local Wire</h3>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-base text-gray-500 font-bold tracking-widest">LIVE FEED</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8" ref={scrollContainerRef}>
        <div className="text-center mb-6 opacity-50">
          <p className="text-base italic">Showing ads near {location.county}</p>
        </div>

        {visibleAds.map((ad, idx) => (
          <div
            key={`${ad.id}-${startIndex}-${idx}`}
            className="transform transition-all duration-500 hover:scale-[1.01]"
          >
            <div className="handwritten-border p-6 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
              {/* Teal highlight for Category - Bigger and Bolder */}
              <span className="absolute top-0 left-0 bg-[#006464] text-white text-base px-4 py-1.5 font-bold tracking-widest">
                {ad.category}
              </span>

              <div className="mt-8">
                <p className="text-2xl leading-relaxed mb-4">{ad.content}</p>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-300 flex justify-between items-center text-gray-600 text-base font-bold">
                <span className="flex items-center gap-2">{ad.contact}</span>
                <span>{ad.timestamp}</span>
              </div>
            </div>
          </div>
        ))}

        <div className="py-8 text-center">
          <button
            onClick={() => setShowPostAdModal(true)}
            className="border-2 border-black px-8 py-3 hover:bg-black hover:text-white transition-colors font-bold text-xl tracking-wide"
          >
            + Post an Ad ($5)
          </button>
        </div>
      </div>

      <PostAdModal
        isOpen={showPostAdModal}
        onClose={() => setShowPostAdModal(false)}
        currentLocation={location}
      />
    </div>
  );
};