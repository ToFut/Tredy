import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const [recentActivity, setRecentActivity] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [notifications, setNotifications] = useState({});

  const addRecentActivity = (activity) => {
    setRecentActivity(prev => [activity, ...prev.slice(0, 4)]); // Keep last 5
  };

  const updateWorkspaceNotification = (workspaceId, count) => {
    setNotifications(prev => ({
      ...prev,
      [workspaceId]: count
    }));
  };

  return (
    <SidebarContext.Provider value={{
      recentActivity,
      workspaces,
      notifications,
      addRecentActivity,
      updateWorkspaceNotification
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};