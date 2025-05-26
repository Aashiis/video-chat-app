'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link'; // Next.js built-in
import { useEffect } from 'react';

// --- Simple SVG Icon Components (inline - reuse from register or define here) ---
const MailIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path d="M2.003 5.884L10 2.161l7.997 3.723A1 1 0 0017 7V4a2 2 0 00-2-2H5a2 2 0 00-2 2v3a1 1 0 00.003.884z" />
    <path d="M17.993 8.001L10 11.839l-7.993-3.838A1 1 0 001 9v6a2 2 0 002 2h14a2 2 0 002-2V9a1 1 0 00-.007-.999z" />
  </svg>
);

const LockIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
  </svg>
);

const EyeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
  </svg>
);

const EyeOffIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
    <path d="M9.88 9.88l-.36-.36A2.003 2.003 0 006.067 12.06l-.36.362A4.003 4.003 0 0010 14a4 4 0 100-8 3.988 3.988 0 00-1.76.42l-.36.36z" />
    <path d="M.458 10C1.732 5.943 5.522 3 10 3a9.958 9.958 0 014.512 1.074l1.78-1.781a1 1 0 011.414 1.414l-14 14a1 1 0 01-1.414-1.414l1.473-1.473A10.014 10.014 0 01.458 10z" />
  </svg>
);

const VideoIcon = ({ className = "w-10 h-10" }: { className?: string }) => ( // App Logo
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17 10.5V7c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-3.5l2.29 2.29c.63.63 1.71.18 1.71-.71V8.91c0-.89-1.08-1.34-1.71-.71L17 10.5z" />
    </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        window.location.href = '/account/profile/';
      }
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
        setError('Email and password are required.');
        setIsLoading(false);
        return;
    }

    // Simulate API call
    console.log('Logging in:', { email, password });
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const response = await fetch('http://127.0.0.1:8000/api/accounts/login/', 
        { method: 'POST', body: JSON.stringify({ email, password }), headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error('Login failed');
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      } 
      const { token } = data;
      if (token) {
        localStorage.setItem('token', token);
        window.location.href = '/account/profile/';
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    }

    setIsLoading(false);
    // For demo purposes:
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Blurred Background Image Layer */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center filter blur-md -z-10"
        style={{ backgroundImage: "url('/images/bg/bg.jpg')" }} // <-- YOUR IMAGE PATH HERE
      ></div>
      {/* Optional: Dark overlay on top of blurred image for better contrast if needed */}
      {/* <div className="absolute inset-0 w-full h-full bg-black/30 -z-10"></div> */}


      <main className="w-full max-w-md z-10"> {/* Content must be on a higher z-index */}
        <div className="bg-slate-800/70 backdrop-blur-lg p-8 rounded-xl shadow-2xl border border-slate-700/50">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-3 text-purple-400">
              <VideoIcon className="h-12 w-12" />
            </Link>
            <h1 className="text-3xl font-bold text-white">Welcome Back!</h1>
            <p className="text-purple-300 mt-1 text-sm">Sign in to continue to your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-1">
                Email or Username
                </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-300">
                  <MailIcon />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition duration-150"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-purple-200">
                  Password
                </label>
                <div className="text-sm">
                  <Link href="/forgot-password" // Or your actual forgot password route
                        className="font-medium text-purple-400 hover:text-purple-300 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-300">
                  <LockIcon />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition duration-150"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-300 hover:text-purple-100"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>


            {error && (
              <p className="text-sm text-red-400 bg-red-900/40 p-2.5 rounded-md text-center">
                {error}
              </p>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link href="/account/register" className="font-medium text-purple-400 hover:text-purple-300 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </main>

      <footer className="mt-8 text-center text-xs text-slate-500 z-10"> {/* Content must be on a higher z-index */}
        © {new Date().getFullYear()} Your Video App
      </footer>
    </div>
  );
}