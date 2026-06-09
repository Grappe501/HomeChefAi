import { useState } from 'react';
import { Link } from 'react-router-dom';
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
      <Link to="/landing" className="text-xs font-medium text-chef-subtle uppercase tracking-wider mb-6 hover:text-chef">
        ← SousChef
      </Link>
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
        className="mt-4 text-sm text-chef-muted font-medium"
      >
        {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create account'}
      </button>

      <p className="mt-8 text-xs text-chef-subtle text-center max-w-sm leading-relaxed">
        By continuing you agree to our{' '}
        <a href="/legal/terms.html" className="text-chef-muted underline">Terms</a>,{' '}
        <a href="/legal/privacy.html" className="text-chef-muted underline">Privacy Policy</a>, and{' '}
        <a href="/legal/ai-usage.html" className="text-chef-muted underline">AI Usage Policy</a>.
      </p>
      <p className="mt-2 text-xs text-chef-subtle">SousChef · operated by HomeChef AI</p>
    </div>
  );
}
