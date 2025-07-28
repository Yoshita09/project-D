/**
 * API and WebSocket configuration utilities
 */

// Get the API base URL from environment variables or use default
export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
};

// Get the WebSocket URL from environment variables or use default
export const getWebSocketUrl = () => {
  return import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080';
};

// Helper function to make API requests
export const apiRequest = async (endpoint, options = {}) => {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
};

// Create a WebSocket connection
export const createWebSocketConnection = () => {
  const wsUrl = getWebSocketUrl();
  const socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('WebSocket connection established');
    // Register as client
    socket.send(JSON.stringify({
      type: 'register',
      role: 'client'
    }));
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  socket.onclose = () => {
    console.log('WebSocket connection closed');
  };
  
  return socket;
};