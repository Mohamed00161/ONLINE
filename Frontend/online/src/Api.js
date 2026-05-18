import axios from 'axios';

// This dynamically points to Render if live, or localhost if developing
const API_URL = import.meta.env.VITE_API_URL || "https://online-wcx5.onrender.com";

const API = axios.create({
  baseURL: API_URL,
  withCredentials: true // Essential for your cookies/session to work
});

export default API;