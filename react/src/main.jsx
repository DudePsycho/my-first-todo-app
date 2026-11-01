// The starting point: React takes over the empty <div id="root"> and draws the App inside it
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";   // a copy of the plain version's design file, so both look identical
import App from "./App.jsx";

// Tell the CSS that JavaScript is running (same as the first line of the plain script.js)
document.documentElement.classList.add("js");

// StrictMode is a helper that warns about mistakes while we build (it does nothing on the live site)
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
