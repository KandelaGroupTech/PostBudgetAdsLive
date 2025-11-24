import React, { useEffect, useState, useRef } from 'react';
import { TextAd, GeoLocation } from '../types';
import { PostAdModal } from './PostAdModal';
import { supabase } from '../utils/supabaseClient';

interface MiddleColumnProps {
  location: GeoLocation;
}

export const MiddleColumn: React.FC<MiddleColumnProps> = ({ location }) => {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostAdModal, setShowPostAdModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAds();
  }, [location]);

  const fetchAds = async () => {
    setLoading(true);
    try {
      // Fetch approved ads that contain the selected location
      // We use the JSONB contains operator @>
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('status', 'approved')
        .contains('locations', JSON.stringify([{ county: location.county, state: location.state }]))
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ads:', error);
      } else {
        setAds(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching ads:', err);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="text-center mb-6">
          <p className="text-base italic">Showing ads near {location.county}</p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading local ads...</div>
        ) : ads.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-xl font-bold text-gray-400 mb-2">No ads here yet</p>
            <p className="text-gray-500">Be the first to post in {location.county}!</p>
          </div>
        ) : (
          ads.map((ad) => (
            <div
              key={ad.id}
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
                  <span className="flex items-center gap-2">{ad.email}</span>
                  <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}

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