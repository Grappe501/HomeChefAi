import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email to confirm, or sign in if confirmation is disabled.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Auth failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-stainless-100">
      <p className="text-xs font-medium text-copper-600 uppercase tracking-wider mb-6">SousChef</p>
      <h1 className="font-sans font-semibold text-3xl text-chef mb-2 tracking-tight">Your Kitchen Has A Memory</h1>
      <p className="text-chef-subtle text-center mb-8 max-w-sm leading-relaxed">
        {mode === 'signup'
          ? 'Track inventory, plan meals, and cook with confidence.'
          : 'Welcome back, Chef.'}
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="input-field"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (6+ characters)"
          required
          minLength={6}
          className="input-field"
        />
        {message && <p className="text-sm text-center text-chef-subtle">{message}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? '...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
        className="mt-4 text-sm text-copper-600 font-medium"
      >
        {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create account'}
      </button>
    </div>
  );
}
