import React from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./css/index.css";
import App from "./App";
import { API_BASE_URL } from "./services/apiConfig";

axios.defaults.baseURL = API_BASE_URL;

createRoot(document.getElementById("root")).render(<App/>);
