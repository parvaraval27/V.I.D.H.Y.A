import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { login, register, isLoggingIn, loginError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await login({ email, password });
      return;
    }

    const { success } = await register({
      username: name,
      email,
      password,
    });

    if (success) {
      setIsLogin(true);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-purple-50">
      {/* Diagonal Split Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-800 opacity-90"
          style={{ clipPath: 'polygon(0 0, 65% 0, 45% 100%, 0 100%)' }}
        ></div>
      </div>

      {/* Notebook Paper Lines on Purple Side */}
      <div className="absolute left-0 top-0 bottom-0 w-[65%] pointer-events-none hidden lg:block">
        <div className="relative h-full ml-16">
          <div className="absolute left-16 top-0 bottom-0 w-0.5 bg-red-400"></div>
          <div className="absolute left-16 top-1/2 -translate-y-1/2 flex flex-col gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-4 border-white/30"></div>
            ))}
          </div>
          {Array.from({ length: 20 }).map((_, i) => {
            const progress = (i + 1) / 20;
            const width = 100 - (progress * 33); // Decrease from 100% to 67%
            return (
              <div
                key={i}
                className="absolute left-0 h-0.5 bg-purple-400/20"
                style={{ 
                  top: `${(i + 1) * 5}%`,
                  width: `${width}%`,
                  right: 'auto'
                }}
              ></div>
            );
          })}
        </div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-7xl flex items-center">
          {/* Left Side - Notebook Themed Visual */}
          <div className="flex-1 hidden lg:flex flex-col items-center justify-center relative px-12">
            <div className="relative w-full max-w-md ml-12">

              <div className="mb-8 flex justify-start">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center transform rotate-6 shadow-2xl p-2">
                  <img src="/favicon.png" alt="V.I.D.H.Y.A Logo" className="w-full h-full object-contain" />
                </div>
              </div>

              <div className="text-white mb-12">
                <h1 className="text-7xl mb-4 transform -rotate-2" style={{ fontFamily: 'cursive' }}>
                  V.I.D.H.Y.A.
                </h1>
                <div className="h-1 w-48 bg-yellow-300 transform -rotate-1 mb-4"></div>
                <p className="text-2xl text-purple-100 transform rotate-1">Voice-enabled Interactive Digital Help for Your Academics</p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <div className="relative">
                <div className="relative bg-gradient-to-br from-amber-50 to-white p-12 shadow-2xl border-2 border-amber-200" style={{ borderRadius: '8px 24px 24px 8px' }}>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 border-l-2 border-b-2 border-amber-300" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}></div>
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-purple-700 via-purple-600 to-purple-700"></div>
                  <div className="absolute -top-2 right-12 w-8 h-32 bg-gradient-to-b from-purple-600 to-purple-700 shadow-lg" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)' }}></div>
                  <div className="absolute -top-3 left-12 bg-purple-600 text-white px-6 py-2 rounded-t-xl text-sm shadow-lg border-2 border-purple-700 border-b-0">
                    {isLogin ? 'Student Login' : 'Create Account'}
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <h2 className="text-3xl font-bold text-purple-900 mb-2">
                      {isLogin ? 'Welcome Back!' : 'Create Account'}
                    </h2>
                    
                    {loginError && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4">
                        <p className="text-red-700">Invalid email or password. Please try again.</p>
                      </div>
                    )}

                    {!isLogin && (
                      <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-medium text-purple-800">Full Name</label>
                        <Input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                          placeholder="John Doe"
                          required={!isLogin}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-purple-800">Email</label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                        placeholder="you@example.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label htmlFor="password" className="block text-sm font-medium text-purple-800">
                          Password
                        </label>
                        {isLogin && (
                          <button type="button" className="text-sm text-purple-600 hover:text-purple-800">
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-purple-300 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoggingIn ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {isLogin ? 'Signing in...' : 'Creating account...'}
                        </span>
                      ) : isLogin ? (
                        'Sign In'
                      ) : (
                        'Create Account'
                      )}
                    </Button>

                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                      >
                        {isLogin 
                          ? "Don't have an account? Sign up"
                          : 'Already have an account? Sign in'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}