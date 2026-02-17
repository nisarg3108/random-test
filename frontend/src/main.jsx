import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PermissionProvider } from "./contexts/PermissionContext";
import "./index.css";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PermissionProvider>
      <App />
    </PermissionProvider>
  </React.StrictMode>
);
