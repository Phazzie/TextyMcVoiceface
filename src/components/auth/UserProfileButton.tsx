import React from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path as needed

const UserProfileButton: React.FC = () => {
  const { user, signOut, isLoading } = useAuth();

  if (!user) {
    return null; // Or a login button if preferred in this component's context
  }

  const handleSignOut = async () => {
    await signOut();
    // User state will update via context, and App will re-render accordingly
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span title={user.email}>
        {user.email?.substring(0, user.email.indexOf('@')) || user.id}
      </span>
      <button onClick={handleSignOut} disabled={isLoading} style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        {isLoading ? 'Signing out...' : 'Sign Out'}
      </button>
    </div>
  );
};

export default UserProfileButton;
