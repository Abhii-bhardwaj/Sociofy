import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const useNavigationTracker = () => {
  const location = useLocation();
  const [historyStack, setHistoryStack] = useState(
    JSON.parse(sessionStorage.getItem("navHistory")) || [location.pathname]
  );

  // Track route changes and update historyStack
  useEffect(() => {
    if (historyStack[historyStack.length - 1] !== location.pathname) {
      const updatedHistory = [...historyStack, location.pathname];
      setHistoryStack(updatedHistory);
      sessionStorage.setItem("navHistory", JSON.stringify(updatedHistory));
    }
  }, [location, historyStack]);

  // Remove popstate handler to avoid interfering with React Router
  // React Router handles back/forward navigation automatically

  return historyStack;
};

export default useNavigationTracker;
