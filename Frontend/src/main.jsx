import React from "react";
import ReactDOM from "react-dom/client";
// import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { useSettingsStore } from "./store/useSettingsStore.js";

const Root = () => {
  const { darkMode, toggleDarkMode } = useSettingsStore();

  // Sync theme on mount and whenever darkMode changes
  React.useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  return <App />;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Root />
  </BrowserRouter>
);
