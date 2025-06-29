import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';

const AuthPage: React.FC = () => {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      {showLogin ? (
        <>
          <LoginForm />
          <p style={{ textAlign: 'center', marginTop: '20px' }}>
            Don't have an account?{' '}
            <button onClick={() => setShowLogin(false)} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}>
              Sign Up
            </button>
          </p>
        </>
      ) : (
        <>
          <SignUpForm />
          <p style={{ textAlign: 'center', marginTop: '20px' }}>
            Already have an account?{' '}
            <button onClick={() => setShowLogin(true)} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}>
              Login
            </button>
          </p>
        </>
      )}
    </div>
  );
};

export default AuthPage;
