import { useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';

export const useNotifier = () => {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error('useNotifier must be used within a NotificationProvider');
  }

  return context;
};
