import { useContext } from 'react';
import { NotificationContext, NotificationType } from '../contexts/NotificationContext';

export const useNotifier = () => {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error('useNotifier must be used within a NotificationProvider');
  }

  // Expose all functions from the context, including the new on and notify
  return {
    addNotification: context.addNotification,
    removeNotification: context.removeNotification, // also exposing removeNotification for completeness
    on: context.on,
    notify: context.notify,
  };
};
