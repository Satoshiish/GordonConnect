import axios from "axios";

export const makeRequest = axios.create({
  baseURL: "https://gordon-connect-p1pl.vercel.app",
  withCredentials: true,
});