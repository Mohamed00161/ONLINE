import axios from 'axios';

// This dynamically points to Render if live, or localhost if developing
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const API = axios.create({
  baseURL: API_URL,
  withCredentials: true // Essential for your cookies/session to work
});

export default API;