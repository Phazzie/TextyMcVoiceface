import React from 'react';
import { Notification as NotificationType } from '../contexts/NotificationContext';

interface NotificationProps {
  notification: NotificationType;
  onClose: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  const { id, message, type } = notification;

  let backgroundColor;
  switch (type) {
    case 'success':
      backgroundColor = 'bg-green-500';
      break;
    case 'error':
      backgroundColor = 'bg-red-500';
      break;
    case 'warning':
      backgroundColor = 'bg-yellow-500';
      break;
    default:
      backgroundColor = 'bg-gray-500';
  }

  return (
    <div className={`p-4 my-2 rounded-md text-white ${backgroundColor}`}>
      <span>{message}</span>
      <button
        onClick={() => onClose(id)}
        className="ml-4 px-2 py-1 rounded-md bg-white text-black"
      >
        Close
      </button>
    </div>
  );
};

export default Notification;
