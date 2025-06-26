import React, { createContext, useState, ReactNode } from 'react';

export enum NotificationType {
  Success = 'success',
  Error = 'error',
  Warning = 'warning',
}

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

// Define a type for the callback function
type EventCallback = (data?: any) => void;
// Define a type for the unsubscribe function
type UnsubscribeFunction = () => void;

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: NotificationType, duration?: number) => void;
  removeNotification: (id: string) => void;
  on: (eventName: string, callback: EventCallback) => UnsubscribeFunction;
  notify: (eventName: string, data?: any) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // Use React.useRef to store subscribers so it doesn't trigger re-renders on change
  // and persists across renders.
  const subscribers = React.useRef<Map<string, EventCallback[]>>(new Map());

  const addNotification = (message: string, type: NotificationType, duration: number = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = { id, message, type, duration };
    setNotifications(prevNotifications => [...prevNotifications, newNotification]);

    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id: string) => {
    setNotifications(prevNotifications => prevNotifications.filter(notification => notification.id !== id));
  };

  const on = (eventName: string, callback: EventCallback): UnsubscribeFunction => {
    if (!subscribers.current.has(eventName)) {
      subscribers.current.set(eventName, []);
    }
    subscribers.current.get(eventName)!.push(callback);

    // Return an unsubscribe function
    return () => {
      const eventCallbacks = subscribers.current.get(eventName);
      if (eventCallbacks) {
        subscribers.current.set(
          eventName,
          eventCallbacks.filter(cb => cb !== callback)
        );
      }
    };
  };

  const notify = (eventName: string, data?: any) => {
    const eventCallbacks = subscribers.current.get(eventName);
    if (eventCallbacks) {
      eventCallbacks.forEach(callback => callback(data));
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, on, notify }}>
      {children}
    </NotificationContext.Provider>
  );
};
