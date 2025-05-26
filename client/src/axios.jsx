// axios.js or wherever you configure axios
import axios from "axios";

const token = localStorage.getItem("token");

export const makeRequest = axios.create({
  baseURL: "https://gordonconnect-production-f2bd.up.railway.app/api",
  headers: {
    Authorization: token ? `Bearer ${token}` : undefined,
  },
});
