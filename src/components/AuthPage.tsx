import React, { useState } from 'react';
import { supabaseService } from '../services/implementations/SupabaseService'; // Adjust path as needed
import { User } from '@supabase/supabase-js';

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      if (mode === 'login') {
        result = await supabaseService.signInWithEmail(email, password);
      } else {
        result = await supabaseService.signUp(email, password);
      }

      if (result.success && result.data) {
        onAuthSuccess(result.data);
      } else {
        setError(result.error || 'An unknown error occurred.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', margin: '8px 0', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', margin: '8px 0', boxSizing: 'border-box' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: '10px 15px', width: '100%', boxSizing: 'border-box' }}>
          {loading ? 'Loading...' : (mode === 'login' ? 'Login' : 'Sign Up')}
        </button>
      </form>
      <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ marginTop: '10px', background: 'none', border: 'none', color: 'blue', cursor: 'pointer', padding: '0' }}>
        {mode === 'login' ? 'Need an account? Sign Up' : 'Have an account? Login'}
      </button>
    </div>
  );
};
