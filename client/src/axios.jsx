// axios.js or wherever you configure axios
import axios from "axios";

export const makeRequest = axios.create({
  baseURL: "https://gordonconnect-production-f2bd.up.railway.app/api",
});

// Add an interceptor to handle guest tokens
makeRequest.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add a response interceptor to handle errors
makeRequest.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);
