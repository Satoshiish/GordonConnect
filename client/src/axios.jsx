// axios.js or wherever you configure axios
import axios from "axios";

export const makeRequest = axios.create({
  baseURL: "https://gordonconnect-production-f2bd.up.railway.app/api",
});

// Add an interceptor to handle guest tokens
makeRequest.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  if (token) {
    // For guest users, use the guest token
    if (user.role === "guest") {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // For regular users, use the JWT token
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
