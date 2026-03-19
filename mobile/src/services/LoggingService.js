import { useState, useCallback, useEffect } from 'react';

// A simple in-memory log store
let logs = [];
const MAX_LOGS = 50;
let listeners = new Set();

const notify = () => {
  listeners.forEach(listener => listener([...logs]));
};

export const LoggingService = {
  log: (message, type = 'info', data = null) => {
    const entry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      message,
      type, // 'info', 'error', 'debug'
      data
    };
    
    logs = [entry, ...logs].slice(0, MAX_LOGS);
    console.log(`[${type.toUpperCase()}] ${message}`, data || '');
    notify();
  },
  
  error: (message, data = null) => {
    LoggingService.log(message, 'error', data);
  },
  
  getLogs: () => [...logs],
  
  clear: () => {
    logs = [];
    notify();
  },
  
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};

export const useLogs = () => {
  const [currentLogs, setCurrentLogs] = useState(LoggingService.getLogs());
  
  useEffect(() => {
    return LoggingService.subscribe(setCurrentLogs);
  }, []);
  
  return {
    logs: currentLogs,
    clearLogs: LoggingService.clear
  };
};
