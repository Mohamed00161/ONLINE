import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import axios from "axios";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter> {/* ✅ Only here */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
axios.defaults.withCredentials = true;