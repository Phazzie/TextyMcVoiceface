import { useContext } from 'react';
import { NotificationContext, NotificationType } from '../contexts/NotificationContext';

export const useNotifier = () => {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error('useNotifier must be used within a NotificationProvider');
  }

  // Return only addNotification for a cleaner API for components triggering notifications
  return {
    addNotification: (message: string, type: NotificationType, duration?: number) =>
      context.addNotification(message, type, duration),
  };
};
