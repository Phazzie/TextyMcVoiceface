import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path as needed
import { SignUpCredentials } from '../../services/implementations/SupabaseService'; // Adjust path

const SignUpForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signUp, isLoading, error } = useAuth();
  const [customError, setCustomError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setCustomError(null);
    if (password !== confirmPassword) {
      setCustomError("Passwords do not match.");
      return;
    }
    const credentials: SignUpCredentials = { email, password };
    const result = await signUp(credentials);
    if (result.success && result.data) {
      // Potentially show a message like "Confirmation email sent. Please check your inbox."
      // The actual user state change will be handled by onAuthStateChange listener.
      // For now, AuthPage will switch back to login or App will show main content if auto-login after confirm.
    } else if (result.error) {
      // Error is already set in useAuth context, but you could customize it here if needed
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h2>Sign Up</h2>
      {customError && <p style={{ color: 'red' }}>{customError}</p>}
      {error && !customError && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        <label htmlFor="signup-email">Email:</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
      </div>
      <div>
        <label htmlFor="signup-password">Password:</label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6} // Example: Enforce minimum password length
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
      </div>
      <div>
        <label htmlFor="signup-confirm-password">Confirm Password:</label>
        <input
          id="signup-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
      </div>
      <button type="submit" disabled={isLoading} style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        {isLoading ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  );
};

export default SignUpForm;
