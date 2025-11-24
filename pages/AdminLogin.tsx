import React, { useState } from 'react';
import { Newspaper } from 'lucide-react';

export const AdminLogin: React.FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple hardcoded password for now - in production use Supabase Auth or env var
        // This is just a basic gate
        if (password === 'admin123' || password === import.meta.env.VITE_ADMIN_PASSWORD) {
            localStorage.setItem('admin_authenticated', 'true');
            window.location.href = '/admin';
        } else {
            setError('Invalid password');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
            <div className="max-w-md w-full p-8 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-col items-center mb-8">
                    <Newspaper size={48} className="text-[#006464] mb-4" />
                    <h1 className="text-3xl font-bold text-center">Admin Access</h1>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-lg font-bold mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border-2 border-black p-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#006464]"
                            placeholder="Enter admin password"
                        />
                    </div>

                    {error && <p className="text-red-600 font-bold">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-[#006464] text-white py-3 text-xl font-bold hover:bg-[#004444] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};
