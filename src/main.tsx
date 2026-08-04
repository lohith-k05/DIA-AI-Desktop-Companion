import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import FloatingApp from "./FloatingApp.tsx";
import "./index.css";

const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {mode === 'floating' ? <FloatingApp /> : <App />}
  </StrictMode>,
);
