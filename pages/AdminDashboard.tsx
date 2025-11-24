import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Newspaper, Check, X, LogOut } from 'lucide-react';

interface Ad {
    id: string;
    created_at: string;
    content: string;
    category: string;
    locations: any[];
    email: string;
    status: 'pending' | 'approved' | 'rejected';
    subtotal: number;
    tax: number;
    total_amount: number;
    admin_comment?: string;
}

export const AdminDashboard: React.FC = () => {
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [selectedAdId, setSelectedAdId] = useState<string | null>(null);

    useEffect(() => {
        fetchPendingAds();
    }, []);

    const fetchPendingAds = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('ads')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAds(data || []);
        } catch (error) {
            console.error('Error fetching ads:', error);
            alert(`Failed to fetch ads: ${(error as any).message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_authenticated');
        window.location.href = '/admin/login';
    };

    const handleModerate = async (adId: string, action: 'approve' | 'reject') => {
        if (!confirm(`Are you sure you want to ${action} this ad?`)) return;

        setProcessingId(adId);
        try {
            const response = await fetch('/api/admin/moderate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adId,
                    action,
                    comment: selectedAdId === adId ? comment : undefined
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to process');
            }

            alert(`Ad ${action}d successfully`);
            setAds(ads.filter(ad => ad.id !== adId));
            setComment('');
            setSelectedAdId(null);
        } catch (error: any) {
            console.error('Error moderating ad:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <nav className="bg-[#006464] text-white p-4 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Newspaper size={24} />
                        <h1 className="text-xl font-bold">PostBudgetAds Admin</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 hover:bg-[#004444] px-3 py-1 rounded transition-colors"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6">
                <h2 className="text-2xl font-bold mb-6">Pending Reviews ({ads.length})</h2>

                {ads.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                        No pending ads to review. Good job!
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {ads.map((ad) => (
                            <div key={ad.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">
                                                {ad.category}
                                            </span>
                                            <span className="text-gray-500 text-sm">
                                                {new Date(ad.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-lg">${(ad.total_amount / 100).toFixed(2)}</div>
                                            <div className="text-sm text-gray-500">{ad.email}</div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-4 font-serif text-lg">
                                        {ad.content}
                                    </div>

                                    <div className="text-sm text-gray-600 mb-4">
                                        <strong>Locations:</strong> {ad.locations.map((l: any) => `${l.county}, ${l.state}`).join('; ')}
                                    </div>

                                    {selectedAdId === ad.id ? (
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Admin Comment (Optional for approval, required for rejection)
                                            </label>
                                            <textarea
                                                className="w-full border rounded p-2"
                                                rows={3}
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Reason for rejection or note..."
                                            />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedAdId(ad.id)}
                                            className="text-sm text-blue-600 hover:underline mb-4 block"
                                        >
                                            Add Comment
                                        </button>
                                    )}

                                    <div className="flex gap-4 border-t pt-4">
                                        <button
                                            onClick={() => handleModerate(ad.id, 'approve')}
                                            disabled={!!processingId}
                                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <Check size={18} />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleModerate(ad.id, 'reject')}
                                            disabled={!!processingId}
                                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <X size={18} />
                                            Reject & Refund
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
