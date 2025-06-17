import React, { useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';
import Notification from './Notification';

const NotificationsContainer: React.FC = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    // This should ideally not happen if the provider is set up correctly
    return null;
  }

  const { notifications, removeNotification } = context;

  return (
    <div className="fixed top-4 right-4 w-80 z-50">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
};

export default NotificationsContainer;
