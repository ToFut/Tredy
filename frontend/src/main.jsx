import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "@/App.jsx";
import "@/index.css";
import protectApp from "@/utils/protectCustomElements";
// import * as serviceWorker from "@/utils/serviceWorker";

// Protect app from external script conflicts
protectApp();

const isDev = process.env.NODE_ENV !== "production";
const REACTWRAP = isDev ? React.Fragment : React.StrictMode;

ReactDOM.createRoot(document.getElementById("root")).render(
  <REACTWRAP>
    <Router>
      <App />
    </Router>
  </REACTWRAP>
);

// Register service worker for PWA capabilities
// if (!isDev) {
//   serviceWorker.register();
//   serviceWorker.checkInstallable();
// }
