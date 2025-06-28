import React, { createContext, useState, ReactNode, useCallback, useRef } from 'react';

export enum NotificationType {
  Success = 'success',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

type ListenerCallback = (data: any) => void;

interface Listeners {
  [eventName: string]: ListenerCallback[];
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: NotificationType, duration?: number) => void;
  removeNotification: (id: string) => void;
  on: (eventName: string, callback: ListenerCallback) => () => void;
  notify: (eventName: string, data?: any) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const listeners = useRef<Listeners>({});

  const addNotification = (message: string, type: NotificationType, duration: number = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = { id, message, type, duration };
    setNotifications(prev => [...prev, newNotification]);
    setTimeout(() => removeNotification(id), duration);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const on = useCallback((eventName: string, callback: ListenerCallback) => {
    if (!listeners.current[eventName]) {
      listeners.current[eventName] = [];
    }
    listeners.current[eventName].push(callback);
    return () => {
      listeners.current[eventName] = listeners.current[eventName].filter(cb => cb !== callback);
    };
  }, []);

  const notify = useCallback((eventName: string, data?: any) => {
    if (listeners.current[eventName]) {
      listeners.current[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for event "${eventName}":`, error);
        }
      });
    }
  }, []);

  const contextValue = {
    notifications,
    addNotification,
    removeNotification,
    on,
    notify,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
