import { useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';

export const useNotifier = () => {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error('useNotifier must be used within a NotificationProvider');
  }

  // Expose the entire context. Components can destructure what they need.
  // e.g., const { addNotification } = useNotifier();
  // e.g., const { on, notify } = useNotifier();
  return context;
};
