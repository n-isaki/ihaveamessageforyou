import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../services/auth';
import { Lock } from 'lucide-react';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await loginAdmin(email, password);
            navigate('/admin/dashboard');
        } catch {
            setError('Failed to login. Please check your credentials.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-cream">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-brand border border-brand-border">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-brand-patina/10 rounded-full flex items-center justify-center">
                        <Lock className="h-6 w-6 text-brand-patina" />
                    </div>
                    <h2 className="mt-6 text-3xl font-display font-bold text-brand-anthracite">Admin Login</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-0 rounded-lg overflow-hidden border border-brand-input-border divide-y divide-brand-border">
                        <input
                            type="email"
                            required
                            className="input-base rounded-none border-0 border-b border-brand-input-border focus:border-brand-patina focus:ring-0 px-3 py-2.5 sm:text-sm"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            required
                            className="input-base rounded-none border-0 focus:border-brand-patina focus:ring-0 px-3 py-2.5 sm:text-sm"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm text-center">{error}</div>
                    )}

                    <div>
                        <button type="submit" className="btn-primary w-full flex justify-center py-2.5 px-4 text-sm rounded-lg">
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
