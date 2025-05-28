// axios.js or wherever you configure axios
import axios from "axios";

export const makeRequest = axios.create({
  baseURL: "https://gordonconnect-production-f2bd.up.railway.app/api",
});

// Add an interceptor to handle tokens
makeRequest.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  
  if (token) {
    // Ensure the Authorization header is properly formatted
    config.headers.Authorization = `Bearer ${token}`;
    console.log("Request to:", config.url);
    console.log("Adding token to request (first 10 chars):", token.substring(0, 10) + "...");
  } else {
    console.log("No token available for request to:", config.url);
  }
  
  return config;
}, (error) => {
  console.error("Request interceptor error:", error);
  return Promise.reject(error);
});

// Add a response interceptor to handle errors
makeRequest.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.status, error.response?.data);
    
    // If token is invalid or expired, clear it
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log("Authentication error - checking token validity");
      
      // Don't automatically clear token, just log the issue
      // localStorage.removeItem("token");
    }
    
    return Promise.reject(error);
  }
);
