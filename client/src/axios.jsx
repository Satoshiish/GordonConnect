import axios from "axios";

export const makeRequest = axios.create({
  baseURL: "https://gordonconnect-production-f2bd.up.railway.app/api",
  withCredentials: true,
});